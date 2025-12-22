// internal/dto/create_problem.go
package dto

type CreateProblemRequest struct {
	ConceptID   int64  `json:"concept_id" validate:"required"`
	Title       string `json:"title" validate:"required"`
	Link        string `json:"link"`
	Difficulty  string `json:"difficulty" validate:"required,oneof=EASY MEDIUM HARD"`
	Summary     string `json:"summary" validate:"required"`
	Description string `json:"description"`
	Answer      string `json:"answer" validate:"required"`
	Hints       string `json:"hints"`
}
