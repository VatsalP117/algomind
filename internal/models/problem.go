package models

import "time"

// Problem = A coding problem added by user
type Problem struct {
	ID           int64     `db:"id"`
	UserID       int64     `db:"user_id"`
	ConceptID    int64     `db:"concept_id"`

	Title        string    `db:"title"`
	Link         string    `db:"link"`
	Difficulty   string    `db:"difficulty"`

	Summary      string    `db:"summary"`
	Description  string    `db:"description"`
	Answer       string    `db:"answer"`
	Hints        string    `db:"hints"`

	CreatedAt    time.Time `db:"created_at"`
}
