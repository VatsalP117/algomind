package problems

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/llm"
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
	db        *database.Service
	llmClient *llm.Client
}

func NewService(db *database.Service, llmClient *llm.Client) *Service {
	return &Service{
		db:        db,
		llmClient: llmClient,
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

	if duplicate, err := s.findDuplicateProblem(ctx, input.UserID, input.ExternalSource, input.ExternalProblemKey); err != nil {
		return nil, err
	} else if duplicate != nil {
		return nil, duplicate
	}

	storedHints := strings.TrimSpace(input.Hints)
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

	insertProblemQuery := `
		INSERT INTO problems (
			user_id,
			concept_id,
			title,
			link,
			difficulty,
			summary,
			description,
			answer,
			answer_language,
			hints,
			external_source,
			external_problem_key,
			created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
		)
		RETURNING id
	`

	var problemID int64
	if err := tx.QueryRowContext(
		ctx,
		insertProblemQuery,
		input.UserID,
		input.ConceptID,
		input.Title,
		nullableString(input.Link),
		input.Difficulty,
		input.Summary,
		nullableString(input.Description),
		input.Answer,
		input.AnswerLanguage,
		storedHints,
		input.ExternalSource,
		input.ExternalProblemKey,
	).Scan(&problemID); err != nil {
		if duplicate, lookupErr := s.lookupDuplicateAfterInsertFailure(ctx, input.UserID, input.ExternalSource, input.ExternalProblemKey, err); lookupErr != nil {
			return nil, lookupErr
		} else if duplicate != nil {
			return nil, duplicate
		}

		return nil, err
	}

	insertReviewStateQuery := `
		INSERT INTO review_states (
			user_id,
			entity_type,
			entity_id,
			next_review_at,
			interval_days,
			ease_factor,
			streak,
			created_at
		) VALUES (
			$1, 'problem', $2, $3, 0, 2.5, 0, NOW()
		)
	`

	if _, err := tx.ExecContext(
		ctx,
		insertReviewStateQuery,
		input.UserID,
		problemID,
		time.Now(),
	); err != nil {
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

func (s *Service) findDuplicateProblem(
	ctx context.Context,
	userID string,
	externalSource *string,
	externalProblemKey *string,
) (*DuplicateProblemError, error) {
	if externalSource == nil || externalProblemKey == nil || *externalSource == "" || *externalProblemKey == "" {
		return nil, nil
	}

	var existingID int64
	err := s.db.Db.GetContext(
		ctx,
		&existingID,
		`SELECT id FROM problems WHERE user_id = $1 AND external_source = $2 AND external_problem_key = $3`,
		userID,
		*externalSource,
		*externalProblemKey,
	)
	if err == nil {
		return &DuplicateProblemError{ProblemID: existingID}, nil
	}
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}

	return nil, err
}

func (s *Service) lookupDuplicateAfterInsertFailure(
	ctx context.Context,
	userID string,
	externalSource *string,
	externalProblemKey *string,
	insertErr error,
) (*DuplicateProblemError, error) {
	var pgErr *pgconn.PgError
	if !errors.As(insertErr, &pgErr) || pgErr.Code != "23505" {
		return nil, nil
	}

	return s.findDuplicateProblem(ctx, userID, externalSource, externalProblemKey)
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

		result, err := s.db.Db.ExecContext(
			dbCtx,
			`
				UPDATE problems
				SET hints = $1
				WHERE id = $2
				  AND user_id = $3
				  AND COALESCE(NULLIF(btrim(hints), ''), '') = ''
			`,
			hints,
			problemID,
			userID,
		)
		if err != nil {
			logger.Error().
				Err(err).
				Int64("duration_ms", time.Since(jobStartedAt).Milliseconds()).
				Msg("Failed to persist generated hints")
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err == nil && rowsAffected > 0 {
			logger.Info().
				Int64("duration_ms", time.Since(jobStartedAt).Milliseconds()).
				Int("hint_chars", len(hints)).
				Int64("rows_affected", rowsAffected).
				Msg("Stored generated hints")
			return
		}

		logger.Info().
			Int64("duration_ms", time.Since(jobStartedAt).Milliseconds()).
			Int("hint_chars", len(hints)).
			Msg("Skipped storing generated hints because hints were already present")
	}()

	return true
}

func nullableString(value string) interface{} {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
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
