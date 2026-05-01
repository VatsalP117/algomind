package repositories

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/jmoiron/sqlx"
)

// CreateProblemInput holds the fields needed to persist a new problem.
type CreateProblemInput struct {
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
	ExternalSource     *string
	ExternalProblemKey *string
}

// ProblemRepository defines the seam between business logic and problem persistence.
type ProblemRepository interface {
	CreateWithinTx(ctx context.Context, tx *sqlx.Tx, input CreateProblemInput) (int64, error)
	GetAllByUser(ctx context.Context, userID string) ([]dto.UserProblemsResponse, error)
	GetByIDAndUser(ctx context.Context, userID string, problemID string) (*dto.UserIndividualProblemResponse, error)
	Delete(ctx context.Context, userID string, problemID string) error
	FindDuplicate(ctx context.Context, userID string, externalSource, externalProblemKey *string) (int64, error)
	UpdateHints(ctx context.Context, userID string, problemID int64, hints string) error
}

// PostgresProblemRepository is the concrete adapter for ProblemRepository.
type PostgresProblemRepository struct {
	db *sqlx.DB
}

// NewPostgresProblemRepository creates a new PostgresProblemRepository.
func NewPostgresProblemRepository(db *sqlx.DB) *PostgresProblemRepository {
	return &PostgresProblemRepository{db: db}
}

func (r *PostgresProblemRepository) CreateWithinTx(ctx context.Context, tx *sqlx.Tx, input CreateProblemInput) (int64, error) {
	query := `
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
	err := tx.QueryRowContext(
		ctx,
		query,
		input.UserID,
		input.ConceptID,
		input.Title,
		nullableString(input.Link),
		input.Difficulty,
		input.Summary,
		nullableString(input.Description),
		input.Answer,
		input.AnswerLanguage,
		input.Hints,
		input.ExternalSource,
		input.ExternalProblemKey,
	).Scan(&problemID)
	return problemID, err
}

func (r *PostgresProblemRepository) GetAllByUser(ctx context.Context, userID string) ([]dto.UserProblemsResponse, error) {
	query := `
		SELECT
			p.id,
			p.title,
			p.difficulty,
			c.title AS tag,
			p.created_at::text AS created_at
		FROM problems p
		LEFT JOIN concepts c ON p.concept_id = c.id
		WHERE p.user_id = $1
	`
	var problems []dto.UserProblemsResponse
	if err := r.db.SelectContext(ctx, &problems, query, userID); err != nil {
		return nil, err
	}
	return problems, nil
}

func (r *PostgresProblemRepository) GetByIDAndUser(ctx context.Context, userID string, problemID string) (*dto.UserIndividualProblemResponse, error) {
	query := `
		SELECT
			p.id,
			p.title,
			p.difficulty,
			c.title AS tag,
			p.created_at::text AS created_at,
			p.description,
			p.answer,
			p.answer_language,
			p.hints
		FROM problems p
		LEFT JOIN concepts c ON p.concept_id = c.id
		WHERE p.user_id = $1 AND p.id = $2
	`
	var problem dto.UserIndividualProblemResponse
	if err := r.db.GetContext(ctx, &problem, query, userID, problemID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &problem, nil
}

func (r *PostgresProblemRepository) Delete(ctx context.Context, userID string, problemID string) error {
	query := `
		DELETE FROM problems
		WHERE user_id = $1 AND id = $2
	`
	_, err := r.db.ExecContext(ctx, query, userID, problemID)
	return err
}

func (r *PostgresProblemRepository) FindDuplicate(ctx context.Context, userID string, externalSource, externalProblemKey *string) (int64, error) {
	if externalSource == nil || externalProblemKey == nil || *externalSource == "" || *externalProblemKey == "" {
		return 0, nil
	}

	var existingID int64
	err := r.db.GetContext(
		ctx,
		&existingID,
		`SELECT id FROM problems WHERE user_id = $1 AND external_source = $2 AND external_problem_key = $3`,
		userID,
		*externalSource,
		*externalProblemKey,
	)
	if err == nil {
		return existingID, nil
	}
	if errors.Is(err, sql.ErrNoRows) {
		return 0, nil
	}
	return 0, err
}

func (r *PostgresProblemRepository) UpdateHints(ctx context.Context, userID string, problemID int64, hints string) error {
	_, err := r.db.ExecContext(
		ctx,
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
	return err
}

func nullableString(value string) interface{} {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

// ReviewStateRepository defines the seam for review state persistence.
type ReviewStateRepository interface {
	CreateForProblemWithinTx(ctx context.Context, tx *sqlx.Tx, userID string, problemID int64) error
	UpsertForProblem(ctx context.Context, userID string, problemID string) error
}

// PostgresReviewStateRepository is the concrete adapter for ReviewStateRepository.
type PostgresReviewStateRepository struct {
	db *sqlx.DB
}

// NewPostgresReviewStateRepository creates a new PostgresReviewStateRepository.
func NewPostgresReviewStateRepository(db *sqlx.DB) *PostgresReviewStateRepository {
	return &PostgresReviewStateRepository{db: db}
}

func (r *PostgresReviewStateRepository) CreateForProblemWithinTx(ctx context.Context, tx *sqlx.Tx, userID string, problemID int64) error {
	query := `
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
	_, err := tx.ExecContext(ctx, query, userID, problemID, time.Now())
	return err
}

func (r *PostgresReviewStateRepository) UpsertForProblem(ctx context.Context, userID string, problemID string) error {
	query := `
		INSERT INTO review_states (
			user_id,
			entity_type,
			entity_id,
			next_review_at,
			interval_days,
			ease_factor,
			streak,
			created_at
		)
		VALUES (
			$1,
			'problem',
			$2,
			$3,
			0,
			2.5,
			0,
			NOW()
		)
		ON CONFLICT (user_id, entity_type, entity_id)
		DO UPDATE SET
			next_review_at = EXCLUDED.next_review_at,
			interval_days = 0,
			ease_factor = 2.5
	`
	_, err := r.db.ExecContext(ctx, query, userID, problemID, time.Now())
	return err
}
