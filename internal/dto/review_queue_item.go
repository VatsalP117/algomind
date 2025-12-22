// internal/dto/review_queue_item.go
package dto

import "time"

type ReviewQueueItem struct {
	EntityType string    `json:"entity_type"`
	EntityID   int64     `json:"entity_id"`

	Title       string `json:"title"`
	Content     string `json:"content,omitempty"`
	Difficulty  string `json:"difficulty,omitempty"`
	Summary     string `json:"summary,omitempty"`
	Answer      string `json:"answer,omitempty"`
	Hints       string `json:"hints,omitempty"`

	NextReviewAt time.Time `json:"next_review_at"`
}
