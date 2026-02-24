package models

import "time"

type Problem struct {
	ID        int64  `db:"id" json:"id"`
	UserID    string `db:"user_id" json:"user_id"`
	ConceptID int64  `db:"concept_id" json:"concept_id"`

	Title      string  `db:"title" json:"title"`
	Link       *string `db:"link" json:"link"`
	Difficulty string  `db:"difficulty" json:"difficulty"`

	Summary     *string `db:"summary" json:"summary"`
	Description string  `db:"description" json:"description"`
	Answer      string  `db:"answer" json:"answer"`
	Hints       *string `db:"hints" json:"hints"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
