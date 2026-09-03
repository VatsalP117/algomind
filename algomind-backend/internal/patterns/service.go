package patterns

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/llm"
	"github.com/VatsalP117/algomind/algomind-backend/internal/repositories"
	"github.com/jackc/pgx/v5/pgconn"
	zlog "github.com/rs/zerolog/log"
)

const (
	StatusDraft     = "draft"
	StatusConfirmed = "confirmed"
)

var (
	ErrProblemNotFound  = errors.New("problem not found")
	ErrCardNotFound     = errors.New("pattern card not found")
	ErrLLMNotConfigured = errors.New("llm client is not configured")
	ErrInvalidPatterns  = errors.New("invalid patterns")
)

// Limit constants shared by LLM-output validation and user edits.
const (
	maxPatternName      = 100
	maxPatternRationale = 1000
	maxRecognitionCues  = 10
	maxRecognitionCue   = 200
	maxTextField        = 5000
)

// UpsertSpec carries the card fields and patterns to persist.
type UpsertSpec struct {
	Status             string
	Drafts             []repositories.PatternDraft
	Model              *string
	RecognitionCues    []string
	Invariant          string
	FirstMove          string
	CommonMistake      string
	ContrastingPattern string
	Explanation        string
}

// Service orchestrates pattern-card operations.
type Service struct {
	db        *database.Service
	repo      repositories.PatternRepository
	llmClient *llm.Client
}

// NewService creates a new pattern-card Service.
func NewService(
	db *database.Service,
	repo repositories.PatternRepository,
	llmClient *llm.Client,
) *Service {
	return &Service{
		db:        db,
		repo:      repo,
		llmClient: llmClient,
	}
}

// GetPatternCard returns the user's pattern card for a problem, or nil
// when either the problem or the card does not exist.
func (s *Service) GetPatternCard(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
	problem, err := s.repo.GetProblemWithConcept(ctx, userID, problemID)
	if err != nil {
		return nil, err
	}
	if problem == nil {
		return nil, ErrProblemNotFound
	}
	return s.buildResponse(ctx, userID, problemID)
}

// GetInsights builds the pattern-intelligence response for the user's
// confirmed patterns: per-pattern aggregates (with derived mastery,
// label and weak insight) plus co-occurrence edges. The repository only
// returns confirmed cards scoped to the user; empty result sets are
// serialized as [] rather than null.
func (s *Service) GetInsights(ctx context.Context, userID string) (*dto.PatternInsightsResponse, error) {
	rows, edges, err := s.repo.GetInsights(ctx, userID)
	if err != nil {
		return nil, err
	}

	patterns := make([]dto.PatternInsight, 0, len(rows))
	for _, row := range rows {
		patterns = append(patterns, BuildPatternInsight(row))
	}
	if edges == nil {
		edges = []dto.PatternEdge{}
	}

	return &dto.PatternInsightsResponse{
		Patterns: patterns,
		Edges:    edges,
	}, nil
}

// GeneratePatternCard synchronously calls the LLM, persists/replaces a
// draft card transactionally, and returns the resulting card.
func (s *Service) GeneratePatternCard(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
	problem, err := s.repo.GetProblemWithConcept(ctx, userID, problemID)
	if err != nil {
		return nil, err
	}
	if problem == nil {
		return nil, ErrProblemNotFound
	}
	if s.llmClient == nil || !s.llmClient.Enabled() {
		return nil, ErrLLMNotConfigured
	}

	logger := zlog.With().
		Str("component", "pattern_card_generation").
		Str("user_id", userID).
		Int64("problem_id", problemID).
		Str("model", s.llmClient.Model()).
		Logger()

	result, err := s.llmClient.GeneratePatternCard(ctx, llm.RequestMetadata{
		UserID:    userID,
		ProblemID: problemID,
	}, llm.PatternCardRequest{
		Title:       problem.Title,
		Difficulty:  problem.Difficulty,
		Concept:     problem.ConceptTitle,
		Summary:     problem.Summary,
		Description: derefString(problem.Description),
		Solution:    problem.Answer,
	})
	if err != nil {
		if errors.Is(err, llm.ErrNotConfigured) {
			return nil, ErrLLMNotConfigured
		}
		logger.Error().Err(err).Msg("LLM pattern-card generation failed")
		return nil, err
	}

	drafts, err := draftsFromLLM(result)
	if err != nil {
		// Invalid LLM output must not become a user-facing 4xx.
		return nil, fmt.Errorf("%w: %v", llm.ErrInvalidOutput, err)
	}

	cues, err := normalizeLLMCues(result.RecognitionCues)
	if err != nil {
		return nil, err
	}
	spec := UpsertSpec{
		Status:             StatusDraft,
		Drafts:             drafts,
		Model:              stringPtr(s.llmClient.Model()),
		RecognitionCues:    cues,
		Invariant:          result.Invariant,
		FirstMove:          result.FirstMove,
		CommonMistake:      result.CommonMistake,
		ContrastingPattern: result.ContrastingPattern,
		Explanation:        result.Explanation,
	}
	spec.Invariant, err = normalizeLLMText(spec.Invariant, "invariant")
	if err != nil {
		return nil, err
	}
	spec.FirstMove, err = normalizeLLMText(spec.FirstMove, "first_move")
	if err != nil {
		return nil, err
	}
	spec.CommonMistake, err = normalizeLLMText(spec.CommonMistake, "common_mistake")
	if err != nil {
		return nil, err
	}
	spec.ContrastingPattern, err = normalizeLLMText(spec.ContrastingPattern, "contrasting_pattern")
	if err != nil {
		return nil, err
	}
	spec.Explanation, err = normalizeLLMText(spec.Explanation, "explanation")
	if err != nil {
		return nil, err
	}

	cardID, err := s.persistCard(ctx, userID, problemID, spec)
	if err != nil {
		return nil, err
	}

	logger.Info().
		Int64("card_id", cardID).
		Int("patterns", len(drafts)).
		Msg("Generated and persisted pattern-card draft")

	return s.buildResponse(ctx, userID, problemID)
}

// UpdatePatternCard validates and persists the user's edited card,
// marking it confirmed. It creates a card when none exists yet.
func (s *Service) UpdatePatternCard(ctx context.Context, userID string, problemID int64, req dto.PatternCardUpdateRequest) (*dto.PatternCardResponse, error) {
	problem, err := s.repo.GetProblemWithConcept(ctx, userID, problemID)
	if err != nil {
		return nil, err
	}
	if problem == nil {
		return nil, ErrProblemNotFound
	}

	drafts, err := normalizePatterns(req.Patterns)
	if err != nil {
		return nil, err
	}

	spec := UpsertSpec{
		Status:             StatusConfirmed,
		Drafts:             drafts,
		RecognitionCues:    trimCues(req.RecognitionCues),
		Invariant:          strings.TrimSpace(req.Invariant),
		FirstMove:          strings.TrimSpace(req.FirstMove),
		CommonMistake:      strings.TrimSpace(req.CommonMistake),
		ContrastingPattern: strings.TrimSpace(req.ContrastingPattern),
		Explanation:        strings.TrimSpace(req.Explanation),
	}

	if _, err := s.persistCard(ctx, userID, problemID, spec); err != nil {
		return nil, err
	}

	return s.buildResponse(ctx, userID, problemID)
}

func (s *Service) persistCard(ctx context.Context, userID string, problemID int64, spec UpsertSpec) (int64, error) {
	tx, err := s.db.Db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, err
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	cardID, err := s.repo.UpsertCardWithinTx(ctx, tx, userID, problemID, repositories.UpsertCardInput{
		Status:             spec.Status,
		RecognitionCues:    spec.RecognitionCues,
		Invariant:          spec.Invariant,
		FirstMove:          spec.FirstMove,
		CommonMistake:      spec.CommonMistake,
		ContrastingPattern: spec.ContrastingPattern,
		Explanation:        spec.Explanation,
		Model:              spec.Model,
	})
	if err != nil {
		return 0, err
	}

	if err := s.repo.ReplacePatternsWithinTx(ctx, tx, userID, cardID, spec.Drafts); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return 0, fmt.Errorf("%w: conflicting pattern data", ErrInvalidPatterns)
		}
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}
	committed = true
	return cardID, nil
}

func (s *Service) buildResponse(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
	card, err := s.repo.GetCardByProblem(ctx, userID, problemID)
	if err != nil {
		return nil, err
	}
	if card == nil {
		return nil, ErrCardNotFound
	}

	patterns, err := s.repo.GetPatternsForCard(ctx, card.ID)
	if err != nil {
		return nil, err
	}
	related, err := s.repo.GetRelatedProblems(ctx, userID, card.ID, problemID)
	if err != nil {
		return nil, err
	}

	response := &dto.PatternCardResponse{
		ProblemID:          card.ProblemID,
		Status:             card.Status,
		Patterns:           make([]dto.PatternCardPattern, 0, len(patterns)),
		RecognitionCues:    card.RecognitionCues,
		Invariant:          card.Invariant,
		FirstMove:          card.FirstMove,
		CommonMistake:      card.CommonMistake,
		ContrastingPattern: card.ContrastingPattern,
		Explanation:        card.Explanation,
		Model:              card.Model,
		CreatedAt:          card.CreatedAt,
		UpdatedAt:          card.UpdatedAt,
		RelatedProblems:    related,
	}
	for _, p := range patterns {
		response.Patterns = append(response.Patterns, dto.PatternCardPattern{
			Name:      p.Name,
			Role:      p.Role,
			Rationale: p.Rationale,
		})
	}
	if response.RelatedProblems == nil {
		response.RelatedProblems = []dto.RelatedProblem{}
	}
	return response, nil
}

// draftsFromLLM converts a validated LLM result into normalized drafts.
func draftsFromLLM(result *llm.PatternCardResult) ([]repositories.PatternDraft, error) {
	input := make([]dto.PatternCardUpdatePattern, 0, len(result.Patterns))
	for _, p := range result.Patterns {
		input = append(input, dto.PatternCardUpdatePattern{
			Name:      p.Name,
			Role:      p.Role,
			Rationale: p.Rationale,
		})
	}
	return normalizePatterns(input)
}

// normalizePatterns trims, validates, and dedupes pattern entries
// case-insensitively. Exactly one primary pattern is required and at
// most three patterns are allowed.
func normalizePatterns(input []dto.PatternCardUpdatePattern) ([]repositories.PatternDraft, error) {
	if len(input) == 0 {
		return nil, fmt.Errorf("%w: at least one pattern is required", ErrInvalidPatterns)
	}

	drafts := make([]repositories.PatternDraft, 0, len(input))
	seen := make(map[string]struct{}, len(input))
	primaryCount := 0

	for _, p := range input {
		name := strings.TrimSpace(p.Name)
		role := strings.ToLower(strings.TrimSpace(p.Role))
		rationale := strings.TrimSpace(p.Rationale)

		if name == "" {
			return nil, fmt.Errorf("%w: pattern name is required", ErrInvalidPatterns)
		}
		if utf8.RuneCountInString(name) > maxPatternName {
			return nil, fmt.Errorf("%w: pattern name exceeds %d characters", ErrInvalidPatterns, maxPatternName)
		}
		if role != "primary" && role != "supporting" {
			return nil, fmt.Errorf("%w: pattern role must be primary or supporting", ErrInvalidPatterns)
		}
		if utf8.RuneCountInString(rationale) > maxPatternRationale {
			return nil, fmt.Errorf("%w: pattern rationale exceeds %d characters", ErrInvalidPatterns, maxPatternRationale)
		}

		key := strings.ToLower(name)
		if _, duplicate := seen[key]; duplicate {
			continue
		}
		seen[key] = struct{}{}

		if role == "primary" {
			primaryCount++
		}
		drafts = append(drafts, repositories.PatternDraft{Name: name, Role: role, Rationale: rationale})
	}

	if len(drafts) > 3 {
		return nil, fmt.Errorf("%w: at most 3 patterns are allowed", ErrInvalidPatterns)
	}
	if primaryCount != 1 {
		return nil, fmt.Errorf("%w: exactly one primary pattern is required", ErrInvalidPatterns)
	}
	return drafts, nil
}

// normalizeLLMText trims a text field and enforces the max length.
func normalizeLLMText(field, label string) (string, error) {
	value := strings.TrimSpace(field)
	if value == "" {
		return "", fmt.Errorf("%w: %s is required", llm.ErrInvalidOutput, label)
	}
	if utf8.RuneCountInString(value) > maxTextField {
		return "", fmt.Errorf("%w: %s exceeds %d characters", llm.ErrInvalidOutput, label, maxTextField)
	}
	return value, nil
}

// normalizeLLMCues trims, drops duplicates, and enforces cue limits.
func normalizeLLMCues(cues []string) ([]string, error) {
	seen := make(map[string]struct{}, len(cues))
	normalized := make([]string, 0, len(cues))
	for _, cue := range cues {
		value := strings.TrimSpace(cue)
		if value == "" {
			continue
		}
		if utf8.RuneCountInString(value) > maxRecognitionCue {
			return nil, fmt.Errorf("%w: recognition cue exceeds %d characters", llm.ErrInvalidOutput, maxRecognitionCue)
		}
		key := strings.ToLower(value)
		if _, duplicate := seen[key]; duplicate {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, value)
		if len(normalized) > maxRecognitionCues {
			return nil, fmt.Errorf("%w: too many recognition cues", llm.ErrInvalidOutput)
		}
	}
	return normalized, nil
}

// trimCues trims and drops empty recognition cues for user edits.
func trimCues(cues []string) []string {
	normalized := make([]string, 0, len(cues))
	for _, cue := range cues {
		if value := strings.TrimSpace(cue); value != "" {
			normalized = append(normalized, value)
		}
	}
	return normalized
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func stringPtr(value string) *string {
	return &value
}
