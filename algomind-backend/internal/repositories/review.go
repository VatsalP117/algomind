package repositories

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/jmoiron/sqlx"
)

// ReviewStateWithDifficulty holds the current SRS state plus the entity difficulty.
type ReviewStateWithDifficulty struct {
	IntervalDays int     `db:"interval_days"`
	EaseFactor   float64 `db:"ease_factor"`
	Streak       int     `db:"streak"`
	Difficulty   string  `db:"difficulty"`
}

// ReviewRepository defines the seam for review state persistence.
type ReviewRepository interface {
	GetQueue(ctx context.Context, userID string) ([]dto.ReviewQueueItem, error)
	GetState(ctx context.Context, userID, entityType, entityID string) (*ReviewStateWithDifficulty, error)
	UpdateState(ctx context.Context, tx *sqlx.Tx, userID, entityType, entityID string, nextReviewAt time.Time, intervalDays int, easeFactor float64, streak int) error
	ResetConceptForProblem(ctx context.Context, tx *sqlx.Tx, userID, problemID string) error
}

// ReviewLogRepository defines the seam for review log persistence.
type ReviewLogRepository interface {
	Create(ctx context.Context, tx *sqlx.Tx, userID, entityType, entityID, rating string) error
}

// UserRepository defines the seam for user streak persistence.
type UserRepository interface {
	UpdateStreak(ctx context.Context, tx *sqlx.Tx, userID string) error
}

// PostgresReviewRepository is the concrete adapter for ReviewRepository.
type PostgresReviewRepository struct {
	db *sqlx.DB
}

// NewPostgresReviewRepository creates a new PostgresReviewRepository.
func NewPostgresReviewRepository(db *sqlx.DB) *PostgresReviewRepository {
	return &PostgresReviewRepository{db: db}
}

func (r *PostgresReviewRepository) GetQueue(ctx context.Context, userID string) ([]dto.ReviewQueueItem, error) {
	query := `
		SELECT
			rs.entity_type,
			rs.entity_id,
			rs.next_review_at,
			p.title       AS problem_title,
			p.difficulty  AS difficulty,
			p.summary     AS summary,
			p.description AS description,
			p.answer      AS answer,
			p.answer_language AS answer_language,
			p.hints       AS hints,
			con.title    AS concept_title,
			con.content  AS content
		FROM review_states rs
		LEFT JOIN problems p
			ON rs.entity_type = 'problem'
			AND rs.entity_id = p.id
		LEFT JOIN concepts con
			ON rs.entity_type = 'concept'
			AND rs.entity_id = con.id
		WHERE rs.user_id = $1
			AND rs.next_review_at <= NOW()
		ORDER BY rs.next_review_at ASC
		LIMIT 50
	`
	var queue []dto.ReviewQueueItem
	if err := r.db.SelectContext(ctx, &queue, query, userID); err != nil {
		return nil, err
	}
	if queue == nil {
		queue = []dto.ReviewQueueItem{}
	}
	return queue, nil
}

func (r *PostgresReviewRepository) GetState(ctx context.Context, userID, entityType, entityID string) (*ReviewStateWithDifficulty, error) {
	var state ReviewStateWithDifficulty
	query := `
		SELECT
			rs.interval_days,
			rs.ease_factor,
			rs.streak,
			COALESCE(p.difficulty, '') AS difficulty
		FROM review_states rs
		LEFT JOIN problems p
			ON rs.entity_type = 'problem'
			AND rs.entity_id = p.id
		WHERE rs.user_id = $1
			AND rs.entity_type = $2
			AND rs.entity_id = $3
	`
	if err := r.db.GetContext(ctx, &state, query, userID, entityType, entityID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &state, nil
}

func (r *PostgresReviewRepository) UpdateState(ctx context.Context, tx *sqlx.Tx, userID, entityType, entityID string, nextReviewAt time.Time, intervalDays int, easeFactor float64, streak int) error {
	query := `
		UPDATE review_states
		SET next_review_at = $1,
		    interval_days = $2,
		    ease_factor = $3,
		    streak = $4
		WHERE user_id = $5
		  AND entity_type = $6
		  AND entity_id = $7
	`
	_, err := tx.ExecContext(ctx, query, nextReviewAt, intervalDays, easeFactor, streak, userID, entityType, entityID)
	return err
}

func (r *PostgresReviewRepository) ResetConceptForProblem(ctx context.Context, tx *sqlx.Tx, userID, problemID string) error {
	query := `
		UPDATE review_states
		SET next_review_at = NOW(),
		    interval_days = 0,
		    streak = 0
		WHERE user_id = $1
		  AND entity_type = 'concept'
		  AND entity_id = (
			  SELECT concept_id FROM problems WHERE id = $2
		  )
	`
	_, err := tx.ExecContext(ctx, query, userID, problemID)
	return err
}

// PostgresReviewLogRepository is the concrete adapter for ReviewLogRepository.
type PostgresReviewLogRepository struct {
	db *sqlx.DB
}

// NewPostgresReviewLogRepository creates a new PostgresReviewLogRepository.
func NewPostgresReviewLogRepository(db *sqlx.DB) *PostgresReviewLogRepository {
	return &PostgresReviewLogRepository{db: db}
}

func (r *PostgresReviewLogRepository) Create(ctx context.Context, tx *sqlx.Tx, userID, entityType, entityID, rating string) error {
	query := `
		INSERT INTO review_logs (
			user_id,
			entity_type,
			entity_id,
			rating,
			reviewed_at
		) VALUES ($1, $2, $3, $4, NOW())
	`
	_, err := tx.ExecContext(ctx, query, userID, entityType, entityID, rating)
	return err
}

// PostgresUserRepository is the concrete adapter for UserRepository.
type PostgresUserRepository struct {
	db *sqlx.DB
}

// NewPostgresUserRepository creates a new PostgresUserRepository.
func NewPostgresUserRepository(db *sqlx.DB) *PostgresUserRepository {
	return &PostgresUserRepository{db: db}
}

func (r *PostgresUserRepository) UpdateStreak(ctx context.Context, tx *sqlx.Tx, userID string) error {
	query := `
		UPDATE users SET
			current_streak = CASE
				WHEN last_review_date = CURRENT_DATE THEN current_streak
				WHEN last_review_date = CURRENT_DATE - 1 THEN current_streak + 1
				ELSE 1
			END,
			longest_streak = GREATEST(longest_streak,
				CASE
					WHEN last_review_date = CURRENT_DATE THEN current_streak
					WHEN last_review_date = CURRENT_DATE - 1 THEN current_streak + 1
					ELSE 1
				END),
			last_review_date = CURRENT_DATE
		WHERE id = $1
	`
	_, err := tx.ExecContext(ctx, query, userID)
	return err
}
