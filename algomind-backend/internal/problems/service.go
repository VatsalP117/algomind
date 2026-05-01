package problems

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/llm"
	"github.com/VatsalP117/algomind/algomind-backend/internal/repositories"
	"github.com/jackc/pgx/v5/pgconn"
	zlog "github.com/rs/zerolog/log"
)

var (
	ErrInvalidConcept       = errors.New("invalid concept")
	ErrConceptNotAccessible = errors.New("concept not accessible")
)

type DuplicateProblemError struct {
	ProblemID int64
}

func (e *DuplicateProblemError) Error() string {
	return fmt.Sprintf("problem already exists with id %d", e.ProblemID)
}

type CreateInput struct {
	UserID             string
	ConceptID          int64
	Title              string
	Link               string
	Difficulty         string
	Summary            string
	Description        string
	Answer             string
	AnswerLanguage     *string
	Hints              string
	GenerateHints      bool
	ExternalSource     *string
	ExternalProblemKey *string
}

type CreateResult struct {
	ID                   int64
	HintGenerationQueued bool
}

type Service struct {
	db              *database.Service
	problemRepo     repositories.ProblemRepository
	reviewStateRepo repositories.ReviewStateRepository
	llmClient       *llm.Client
}

func NewService(
	db *database.Service,
	problemRepo repositories.ProblemRepository,
	reviewStateRepo repositories.ReviewStateRepository,
	llmClient *llm.Client,
) *Service {
	return &Service{
		db:              db,
		problemRepo:     problemRepo,
		reviewStateRepo: reviewStateRepo,
		llmClient:       llmClient,
	}
}

func (s *Service) CreateReviewableProblem(ctx context.Context, input CreateInput) (*CreateResult, error) {
	var concept struct {
		UserID *string `db:"user_id"`
		Title  string  `db:"title"`
	}

	if err := s.db.Db.GetContext(
		ctx,
		&concept,
		"SELECT user_id, title FROM concepts WHERE id = $1",
		input.ConceptID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInvalidConcept
		}
		return nil, err
	}
	if concept.UserID != nil && *concept.UserID != input.UserID {
		return nil, ErrConceptNotAccessible
	}

	if duplicateID, err := s.problemRepo.FindDuplicate(ctx, input.UserID, input.ExternalSource, input.ExternalProblemKey); err != nil {
		return nil, err
	} else if duplicateID != 0 {
		return nil, &DuplicateProblemError{ProblemID: duplicateID}
	}

	storedHints := input.Hints
	if input.GenerateHints {
		storedHints = ""
	}

	tx, err := s.db.Db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	problemID, err := s.problemRepo.CreateWithinTx(ctx, tx, repositories.CreateProblemInput{
		UserID:             input.UserID,
		ConceptID:          input.ConceptID,
		Title:              input.Title,
		Link:               input.Link,
		Difficulty:         input.Difficulty,
		Summary:            input.Summary,
		Description:        input.Description,
		Answer:             input.Answer,
		AnswerLanguage:     input.AnswerLanguage,
		Hints:              storedHints,
		ExternalSource:     input.ExternalSource,
		ExternalProblemKey: input.ExternalProblemKey,
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			if duplicateID, lookupErr := s.problemRepo.FindDuplicate(ctx, input.UserID, input.ExternalSource, input.ExternalProblemKey); lookupErr != nil {
				return nil, lookupErr
			} else if duplicateID != 0 {
				return nil, &DuplicateProblemError{ProblemID: duplicateID}
			}
		}
		return nil, err
	}

	if err := s.reviewStateRepo.CreateForProblemWithinTx(ctx, tx, input.UserID, problemID); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	committed = true

	hintGenerationQueued := false
	if input.GenerateHints {
		hintGenerationQueued = s.enqueueHintGeneration(input.UserID, problemID, llm.HintRequest{
			Title:          input.Title,
			Difficulty:     input.Difficulty,
			Summary:        input.Summary,
			Description:    input.Description,
			Answer:         input.Answer,
			ConceptTitle:   concept.Title,
			AnswerLanguage: derefString(input.AnswerLanguage),
		})
	}

	return &CreateResult{
		ID:                   problemID,
		HintGenerationQueued: hintGenerationQueued,
	}, nil
}

func (s *Service) enqueueHintGeneration(userID string, problemID int64, req llm.HintRequest) bool {
	jobID := newHintGenerationJobID(problemID)
	logger := zlog.With().
		Str("component", "llm_hint_generation").
		Str("job_id", jobID).
		Str("user_id", userID).
		Int64("problem_id", problemID).
		Logger()

	if s.llmClient == nil || !s.llmClient.Enabled() {
		logger.Warn().Msg("Hint generation requested but LLM client is not configured")
		return false
	}

	go func() {
		jobStartedAt := time.Now()
		logger.Info().Msg("Background hint generation started")

		llmCtx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
		defer cancel()

		hints, err := s.llmClient.GenerateHints(llmCtx, llm.RequestMetadata{
			JobID:     jobID,
			UserID:    userID,
			ProblemID: problemID,
		}, req)
		if err != nil {
			logger.Error().
				Err(err).
				Int64("duration_ms", time.Since(jobStartedAt).Milliseconds()).
				Msg("Background hint generation failed")
			return
		}

		dbCtx, dbCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer dbCancel()

		if err := s.problemRepo.UpdateHints(dbCtx, userID, problemID, hints); err != nil {
			logger.Error().
				Err(err).
				Int64("duration_ms", time.Since(jobStartedAt).Milliseconds()).
				Msg("Failed to persist generated hints")
			return
		}

		logger.Info().
			Int64("duration_ms", time.Since(jobStartedAt).Milliseconds()).
			Int("hint_chars", len(hints)).
			Msg("Stored generated hints")
	}()

	return true
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func newHintGenerationJobID(problemID int64) string {
	return fmt.Sprintf("hint-%d-%d", problemID, time.Now().UnixNano())
}
