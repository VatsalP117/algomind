package models

import "time"

type ProblemCapture struct {
	ID                 int64           `db:"id" json:"id"`
	UserID             string          `db:"user_id" json:"user_id"`
	Source             string          `db:"source" json:"source"`
	ExternalProblemKey string          `db:"external_problem_key" json:"external_problem_key"`
	CanonicalURL       string          `db:"canonical_url" json:"canonical_url"`
	Title              *string         `db:"title" json:"title"`
	Difficulty         *string         `db:"difficulty" json:"difficulty"`
	DescriptionHTML    *string         `db:"description_html" json:"description_html"`
	TopicTags          JSONStringArray `db:"topic_tags" json:"topic_tags"`
	CaptureState       string          `db:"capture_state" json:"capture_state"`
	FallbackTitle      *string         `db:"fallback_title" json:"fallback_title"`
	FallbackDifficulty *string         `db:"fallback_difficulty" json:"fallback_difficulty"`
	ProblemID          *int64          `db:"problem_id" json:"problem_id"`
	LastErrorCode      *string         `db:"last_error_code" json:"last_error_code"`
	LastErrorMessage   *string         `db:"last_error_message" json:"last_error_message"`
	CapturedAt         time.Time       `db:"captured_at" json:"captured_at"`
	UpdatedAt          time.Time       `db:"updated_at" json:"updated_at"`
	ImportedAt         *time.Time      `db:"imported_at" json:"imported_at"`
}
