package models

import "time"

type ReviewState struct {
	ID            int64     `db:"id"`
	UserID        int64     `db:"user_id"`

	// Polymorphic relation
	EntityType    string    `db:"entity_type"` // "concept" | "problem"
	EntityID      int64     `db:"entity_id"`

	NextReviewAt  time.Time `db:"next_review_at"`
	IntervalDays  int       `db:"interval_days"`
	EaseFactor    float64   `db:"ease_factor"`
	Streak        int       `db:"streak"`

	CreatedAt     time.Time `db:"created_at"`
}
