// internal/dto/create_problem.go
package dto

type CreateProblemRequest struct {
	ConceptID      int64   `json:"concept_id" validate:"required"`
	Title          string  `json:"title" validate:"required"`
	Link           string  `json:"link"`
	Difficulty     string  `json:"difficulty" validate:"required,oneof=EASY MEDIUM HARD"`
	Summary        string  `json:"summary" validate:"required"`
	Description    string  `json:"description"`
	Answer         string  `json:"answer" validate:"required"`
	AnswerLanguage *string `json:"answer_language"`
	Hints          string  `json:"hints"`
}

type UserProblemsResponse struct {
	ID         int64  `json:"id" db:"id"`
	Title      string `json:"title" db:"title"`
	Difficulty string `json:"difficulty" db:"difficulty"`
	Tag        string `json:"tag" db:"tag"`
	DateAdded  string `json:"date_added" db:"created_at"`
}

type UserIndividualProblemResponse struct {
	UserProblemsResponse
	Description    string  `json:"description" db:"description"`
	Answer         string  `json:"answer" db:"answer"`
	AnswerLanguage *string `json:"answer_language" db:"answer_language"`
	Hints          *string `json:"hints" db:"hints"`
}
