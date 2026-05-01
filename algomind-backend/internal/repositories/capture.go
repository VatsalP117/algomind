package repositories

import (
	"context"
	"database/sql"
	"errors"
	"strconv"
	"strings"

	"github.com/VatsalP117/algomind/algomind-backend/internal/models"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jmoiron/sqlx"
)

// CaptureInsertInput holds the fields needed to persist a new capture.
type CaptureInsertInput struct {
	UserID             string
	Source             string
	ExternalProblemKey string
	CanonicalURL       string
	Title              *string
	Difficulty         *string
	DescriptionHTML    *string
	TopicTags          models.JSONStringArray
	CaptureState       string
	SourcePayload      interface{}
	FallbackTitle      *string
	FallbackDifficulty *string
	FallbackNotes      *string
	LastErrorCode      *string
	LastErrorMessage   *string
}

// CaptureRepository defines the seam for problem capture persistence.
type CaptureRepository interface {
	List(ctx context.Context, userID string) ([]models.ProblemCapture, error)
	GetByID(ctx context.Context, userID string, captureID string) (*models.ProblemCapture, error)
	Archive(ctx context.Context, userID string, captureID string) (bool, error)
	Insert(ctx context.Context, input CaptureInsertInput) (*models.ProblemCapture, bool, error)
	Reactivate(ctx context.Context, captureID int64) error
	FindBySourceKey(ctx context.Context, userID, source, externalProblemKey string) (*models.ProblemCapture, error)
	MarkImported(ctx context.Context, captureID, problemID int64) error
	UpdateFailedState(ctx context.Context, captureID int64, errorCode, errorMessage string) error
	RefreshFromFetch(ctx context.Context, captureID int64, title, difficulty, description string, tags models.JSONStringArray, payloadBytes []byte, nextState string) (*models.ProblemCapture, error)
	FindImportedProblem(ctx context.Context, userID, source, externalProblemKey string) (*int64, error)
}

// PostgresCaptureRepository is the concrete adapter for CaptureRepository.
type PostgresCaptureRepository struct {
	db *sqlx.DB
}

// NewPostgresCaptureRepository creates a new PostgresCaptureRepository.
func NewPostgresCaptureRepository(db *sqlx.DB) *PostgresCaptureRepository {
	return &PostgresCaptureRepository{db: db}
}

func (r *PostgresCaptureRepository) List(ctx context.Context, userID string) ([]models.ProblemCapture, error) {
	var captures []models.ProblemCapture
	if err := r.db.SelectContext(
		ctx,
		&captures,
		`SELECT id, user_id, source, external_problem_key, canonical_url, title, difficulty, description_html,
		        topic_tags, capture_state, fallback_title, fallback_difficulty, problem_id, last_error_code,
		        last_error_message, captured_at, updated_at, imported_at
		 FROM problem_captures
		 WHERE user_id = $1 AND capture_state != 'archived'
		 ORDER BY captured_at DESC`,
		userID,
	); err != nil {
		return nil, err
	}
	if captures == nil {
		captures = []models.ProblemCapture{}
	}
	return captures, nil
}

func (r *PostgresCaptureRepository) GetByID(ctx context.Context, userID string, captureID string) (*models.ProblemCapture, error) {
	var capture models.ProblemCapture
	if err := r.db.GetContext(
		ctx,
		&capture,
		`SELECT id, user_id, source, external_problem_key, canonical_url, title, difficulty, description_html,
		        topic_tags, capture_state, fallback_title, fallback_difficulty, problem_id, last_error_code,
		        last_error_message, captured_at, updated_at, imported_at
		 FROM problem_captures
		 WHERE id = $1 AND user_id = $2`,
		captureID,
		userID,
	); err != nil {
		return nil, err
	}
	return &capture, nil
}

func (r *PostgresCaptureRepository) Archive(ctx context.Context, userID string, captureID string) (bool, error) {
	result, err := r.db.ExecContext(
		ctx,
		`UPDATE problem_captures
		 SET capture_state = 'archived',
		     updated_at = NOW()
		 WHERE id = $1 AND user_id = $2`,
		captureID,
		userID,
	)
	if err != nil {
		return false, err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return rowsAffected > 0, nil
}

func (r *PostgresCaptureRepository) Insert(ctx context.Context, input CaptureInsertInput) (*models.ProblemCapture, bool, error) {
	query := `
		INSERT INTO problem_captures (
			user_id,
			source,
			external_problem_key,
			canonical_url,
			title,
			difficulty,
			description_html,
			topic_tags,
			capture_state,
			source_payload,
			fallback_title,
			fallback_difficulty,
			fallback_notes,
			last_error_code,
			last_error_message
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15
		)
		RETURNING id, user_id, source, external_problem_key, canonical_url, title, difficulty, description_html,
		          topic_tags, capture_state, fallback_title, fallback_difficulty, problem_id, last_error_code,
		          last_error_message, captured_at, updated_at, imported_at
	`

	var capture models.ProblemCapture
	err := r.db.GetContext(
		ctx,
		&capture,
		query,
		input.UserID,
		input.Source,
		input.ExternalProblemKey,
		input.CanonicalURL,
		input.Title,
		input.Difficulty,
		input.DescriptionHTML,
		input.TopicTags,
		input.CaptureState,
		input.SourcePayload,
		input.FallbackTitle,
		input.FallbackDifficulty,
		input.FallbackNotes,
		input.LastErrorCode,
		input.LastErrorMessage,
	)
	if err == nil {
		return &capture, true, nil
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		existingCapture, selectErr := r.FindBySourceKey(ctx, input.UserID, input.Source, input.ExternalProblemKey)
		if selectErr != nil {
			return nil, false, selectErr
		}
		if reactivateErr := r.Reactivate(ctx, existingCapture.ID); reactivateErr != nil {
			return nil, false, reactivateErr
		}
		updatedCapture, fetchErr := r.GetByID(ctx, input.UserID, strconv.FormatInt(existingCapture.ID, 10))
		return updatedCapture, false, fetchErr
	}

	return nil, false, err
}

func (r *PostgresCaptureRepository) Reactivate(ctx context.Context, captureID int64) error {
	_, err := r.db.ExecContext(
		ctx,
		`UPDATE problem_captures
		 SET capture_state = CASE
		 		WHEN problem_id IS NOT NULL THEN 'imported'
		 		WHEN capture_state = 'archived' THEN 'ready'
		 		ELSE capture_state
		     END,
		     updated_at = NOW(),
		     captured_at = CASE WHEN capture_state = 'archived' THEN NOW() ELSE captured_at END
		 WHERE id = $1`,
		captureID,
	)
	return err
}

func (r *PostgresCaptureRepository) FindBySourceKey(ctx context.Context, userID, source, externalProblemKey string) (*models.ProblemCapture, error) {
	var capture models.ProblemCapture
	if err := r.db.GetContext(
		ctx,
		&capture,
		`SELECT id, user_id, source, external_problem_key, canonical_url, title, difficulty, description_html,
		        topic_tags, capture_state, fallback_title, fallback_difficulty, problem_id, last_error_code,
		        last_error_message, captured_at, updated_at, imported_at
		 FROM problem_captures
		 WHERE user_id = $1 AND source = $2 AND external_problem_key = $3`,
		userID,
		source,
		externalProblemKey,
	); err != nil {
		return nil, err
	}
	return &capture, nil
}

func (r *PostgresCaptureRepository) MarkImported(ctx context.Context, captureID, problemID int64) error {
	_, err := r.db.ExecContext(
		ctx,
		`UPDATE problem_captures
		 SET problem_id = $2,
		     capture_state = 'imported',
		     imported_at = COALESCE(imported_at, NOW()),
		     updated_at = NOW()
		 WHERE id = $1`,
		captureID,
		problemID,
	)
	return err
}

func (r *PostgresCaptureRepository) UpdateFailedState(ctx context.Context, captureID int64, errorCode, errorMessage string) error {
	_, err := r.db.ExecContext(
		ctx,
		`UPDATE problem_captures
		 SET capture_state = 'failed',
		     last_error_code = $2,
		     last_error_message = $3,
		     updated_at = NOW()
		 WHERE id = $1`,
		captureID,
		errorCode,
		errorMessage,
	)
	return err
}

func (r *PostgresCaptureRepository) RefreshFromFetch(ctx context.Context, captureID int64, title, difficulty, description string, tags models.JSONStringArray, payloadBytes []byte, nextState string) (*models.ProblemCapture, error) {
	var refreshed models.ProblemCapture
	if err := r.db.GetContext(
		ctx,
		&refreshed,
		`UPDATE problem_captures
		 SET title = $2,
		     difficulty = $3,
		     description_html = $4,
		     topic_tags = $5,
		     capture_state = $6,
		     source_payload = $7::jsonb,
		     last_error_code = NULL,
		     last_error_message = NULL,
		     updated_at = NOW()
		 WHERE id = $1
		 RETURNING id, user_id, source, external_problem_key, canonical_url, title, difficulty, description_html,
		           topic_tags, capture_state, fallback_title, fallback_difficulty, problem_id, last_error_code,
		           last_error_message, captured_at, updated_at, imported_at`,
		captureID,
		title,
		difficulty,
		description,
		tags,
		nextState,
		payloadBytes,
	); err != nil {
		return nil, err
	}
	return &refreshed, nil
}

func (r *PostgresCaptureRepository) FindImportedProblem(ctx context.Context, userID, source, externalProblemKey string) (*int64, error) {
	var problemID int64
	err := r.db.GetContext(
		ctx,
		&problemID,
		`SELECT id
		 FROM problems
		 WHERE user_id = $1 AND external_source = $2 AND external_problem_key = $3`,
		userID,
		source,
		externalProblemKey,
	)
	if err == nil {
		return &problemID, nil
	}
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return nil, err
}

func CaptureDisplayTitle(capture *models.ProblemCapture) *string {
	if capture == nil {
		return nil
	}
	if capture.Title != nil && strings.TrimSpace(*capture.Title) != "" {
		return capture.Title
	}
	if capture.FallbackTitle != nil && strings.TrimSpace(*capture.FallbackTitle) != "" {
		return capture.FallbackTitle
	}
	return nil
}

func NormalizeDifficulty(value string) string {
	normalized := strings.ToUpper(strings.TrimSpace(value))
	switch normalized {
	case "EASY", "MEDIUM", "HARD":
		return normalized
	default:
		return ""
	}
}

func StringPtr(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return &value
}

func Int64ToString(value int64) string {
	return strconv.FormatInt(value, 10)
}
