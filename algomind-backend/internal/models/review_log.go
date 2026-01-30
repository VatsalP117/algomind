package models

import "time"

// ReviewLog = one review event
type ReviewLog struct {
    ID           int64     `db:"id" json:"id"`
    UserID       string    `db:"user_id" json:"user_id"`     // Changed: int64 -> string

    EntityType   string    `db:"entity_type" json:"entity_type"`
    EntityID     int64     `db:"entity_id" json:"entity_id"`

    Rating       string    `db:"rating" json:"rating"`
    ReviewedAt   time.Time `db:"reviewed_at" json:"reviewed_at"`
}
