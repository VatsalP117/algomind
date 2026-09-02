package dto

import (
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/models"
)

// PatternCardPattern is one pattern entry on a card.
type PatternCardPattern struct {
	Name      string `json:"name"`
	Role      string `json:"role"`
	Rationale string `json:"rationale"`
}

// PatternCardUpdatePattern is a pattern entry submitted by the user.
type PatternCardUpdatePattern struct {
	Name      string `json:"name" validate:"required,max=100"`
	Role      string `json:"role" validate:"required,oneof=primary supporting"`
	Rationale string `json:"rationale" validate:"max=1000"`
}

// PatternCardUpdateRequest carries the editable structured fields of a
// pattern card. IDs, model, timestamps and related problems are managed
// by the server.
type PatternCardUpdateRequest struct {
	Patterns           []PatternCardUpdatePattern `json:"patterns" validate:"required,min=1,max=3,dive"`
	RecognitionCues    []string                   `json:"recognition_cues" validate:"max=10,dive,max=200"`
	Invariant          string                     `json:"invariant" validate:"max=5000"`
	FirstMove          string                     `json:"first_move" validate:"max=5000"`
	CommonMistake      string                     `json:"common_mistake" validate:"max=5000"`
	ContrastingPattern string                     `json:"contrasting_pattern" validate:"max=5000"`
	Explanation        string                     `json:"explanation" validate:"max=5000"`
}

// RelatedProblem is a problem sharing at least one pattern with the
// source problem's card.
type RelatedProblem struct {
	ID             int64                  `json:"id" db:"id"`
	Title          string                 `json:"title" db:"title"`
	Difficulty     string                 `json:"difficulty" db:"difficulty"`
	SharedPatterns models.JSONStringArray `json:"shared_patterns" db:"shared_patterns"`
}

// PatternCardResponse is the full representation returned by the
// pattern-card endpoints.
type PatternCardResponse struct {
	ProblemID          int64                  `json:"problem_id"`
	Status             string                 `json:"status"`
	Patterns           []PatternCardPattern   `json:"patterns"`
	RecognitionCues    models.JSONStringArray `json:"recognition_cues"`
	Invariant          string                 `json:"invariant"`
	FirstMove          string                 `json:"first_move"`
	CommonMistake      string                 `json:"common_mistake"`
	ContrastingPattern string                 `json:"contrasting_pattern"`
	Explanation        string                 `json:"explanation"`
	Model              *string                `json:"model"`
	CreatedAt          time.Time              `json:"created_at"`
	UpdatedAt          time.Time              `json:"updated_at"`
	RelatedProblems    []RelatedProblem       `json:"related_problems"`
}
