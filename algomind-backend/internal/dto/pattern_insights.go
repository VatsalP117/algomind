package dto

// PatternInsightRow is one per-pattern aggregate row produced by the
// pattern-insights repository query. It carries only raw counts; the
// mastery score, label and weak insight are derived in pure Go by the
// patterns service.
type PatternInsightRow struct {
	PatternID       int64  `db:"pattern_id"`
	Name            string `db:"name"`
	ConfirmedCount  int    `db:"confirmed_count"`
	DueCount        int    `db:"due_count"`
	RecognizedCount int    `db:"recognized_count"`
	PartialCount    int    `db:"partial_count"`
	MissedCount     int    `db:"missed_count"`
	Attempts        int    `db:"attempts"`
}

// PatternInsight is the user-facing aggregation for one confirmed pattern.
// MasteryScore is null until at least one recognition attempt exists;
// Label and Insight follow the same conservative rules.
type PatternInsight struct {
	PatternID       int64    `json:"pattern_id"`
	Name            string   `json:"name"`
	ConfirmedCount  int      `json:"confirmed_count"`
	DueCount        int      `json:"due_count"`
	RecognizedCount int      `json:"recognized_count"`
	PartialCount    int      `json:"partial_count"`
	MissedCount     int      `json:"missed_count"`
	Attempts        int      `json:"attempts"`
	MasteryScore    *float64 `json:"mastery_score"`
	Label           *string  `json:"label"`
	Insight         *string  `json:"insight"`
}

// PatternEdge links two patterns that co-occur on at least one confirmed
// problem card. SharedProblemCount reports how many confirmed problems
// carry both patterns.
type PatternEdge struct {
	SourcePatternID    int64 `json:"source_pattern_id" db:"source_pattern_id"`
	TargetPatternID    int64 `json:"target_pattern_id" db:"target_pattern_id"`
	SharedProblemCount int   `json:"shared_problem_count" db:"shared_problem_count"`
}

// PatternInsightsResponse is the response body of GET /patterns/insights.
// Empty slices serialize as [] rather than null.
type PatternInsightsResponse struct {
	Patterns []PatternInsight `json:"patterns"`
	Edges    []PatternEdge    `json:"edges"`
}
