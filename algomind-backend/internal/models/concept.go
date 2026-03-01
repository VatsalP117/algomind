package models

import "time"

type Concept struct {
	ID            int64     `db:"id" json:"id"`
	UserID        *string   `db:"user_id" json:"user_id"`
	BaseConceptID *int64    `db:"base_concept_id" json:"base_concept_id"`
	Title         string    `db:"title" json:"title"`
	Description   *string   `db:"description" json:"description"`
	Content       string    `db:"content" json:"content"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
}
