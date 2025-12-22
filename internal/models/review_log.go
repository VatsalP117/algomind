package models

import "time"

// ReviewLog = one review event
type ReviewLog struct {
	ID           int64     `db:"id"`
	UserID       int64     `db:"user_id"`

	EntityType   string    `db:"entity_type"` // "concept" | "problem"
	EntityID     int64     `db:"entity_id"`

	Rating       string    `db:"rating"` // AGAIN | GOOD | EASY
	ReviewedAt   time.Time `db:"reviewed_at"`
}
