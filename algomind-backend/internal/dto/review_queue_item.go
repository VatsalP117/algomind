package dto

import "time"

type ReviewQueueItem struct {
	EntityType   string    `db:"entity_type" json:"entity_type"`
	EntityID     int64     `db:"entity_id" json:"entity_id"`
	NextReviewAt time.Time `db:"next_review_at" json:"next_review_at"`

	// Problem fields (nullable because of LEFT JOIN)
	ProblemTitle *string `db:"problem_title" json:"title,omitempty"`
	Difficulty   *string `db:"difficulty" json:"difficulty,omitempty"`
	Summary      *string `db:"summary" json:"summary,omitempty"`
	Answer       *string `db:"answer" json:"answer,omitempty"`
	Hints        *string `db:"hints" json:"hints,omitempty"`

	// Concept fields (nullable)
	ConceptTitle *string `db:"concept_title" json:"concept_title,omitempty"`
	Content      *string `db:"content" json:"content,omitempty"`
}
