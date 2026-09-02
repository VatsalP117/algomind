package models

import "time"

// Pattern is a per-user normalized pattern name. Names are unique
// case-insensitively within a user via idx_patterns_user_name_unique.
type Pattern struct {
	ID        int64     `db:"id"`
	UserID    string    `db:"user_id"`
	Name      string    `db:"name"`
	CreatedAt time.Time `db:"created_at"`
}

// ProblemPattern associates a pattern with a card in a specific
// ordered position and role (primary/supporting).
type ProblemPattern struct {
	ID        int64  `db:"id"`
	CardID    int64  `db:"card_id"`
	PatternID int64  `db:"pattern_id"`
	Name      string `db:"name"`
	Role      string `db:"role"`
	Rationale string `db:"rationale"`
	Position  int    `db:"position"`
}

// ProblemPatternCard is the structured pattern card attached to a
// problem. Status is one of "draft" (AI-generated, unconfirmed) or
// "confirmed" (user-edited/accepted).
type ProblemPatternCard struct {
	ID                 int64           `db:"id"`
	ProblemID          int64           `db:"problem_id"`
	UserID             string          `db:"user_id"`
	Status             string          `db:"status"`
	RecognitionCues    JSONStringArray `db:"recognition_cues"`
	Invariant          string          `db:"invariant"`
	FirstMove          string          `db:"first_move"`
	CommonMistake      string          `db:"common_mistake"`
	ContrastingPattern string          `db:"contrasting_pattern"`
	Explanation        string          `db:"explanation"`
	Model              *string         `db:"model"`
	CreatedAt          time.Time       `db:"created_at"`
	UpdatedAt          time.Time       `db:"updated_at"`
}
