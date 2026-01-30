package models

import "time"

type ReviewState struct {
	ID     int64  `db:"id" json:"id"`
	UserID string `db:"user_id" json:"user_id"`

	EntityType string `db:"entity_type" json:"entity_type"`
	EntityID   int64  `db:"entity_id" json:"entity_id"`

	NextReviewAt time.Time `db:"next_review_at" json:"next_review_at"`
	IntervalDays int       `db:"interval_days" json:"interval_days"`
	EaseFactor   float64   `db:"ease_factor" json:"ease_factor"`
	Streak       int       `db:"streak" json:"streak"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
