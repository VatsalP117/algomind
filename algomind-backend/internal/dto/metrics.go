package dto

import "time"

// DashboardSummary contains aggregated stats for the user dashboard
type DashboardSummary struct {
	DueCount      int `json:"due_count" db:"due_count"`
	CurrentStreak int `json:"current_streak" db:"current_streak"`
	LongestStreak int `json:"longest_streak" db:"longest_streak"`
	ReviewsToday  int `json:"reviews_today" db:"reviews_today"`
	TotalProblems int `json:"total_problems" db:"total_problems"`
}

// RecallDataPoint represents recall quality for a single day
type RecallDataPoint struct {
	Date              time.Time `json:"date" db:"date"`
	TotalReviews      int       `json:"total_reviews" db:"total_reviews"`
	SuccessfulReviews int       `json:"successful_reviews" db:"successful_reviews"`
	RecallRate        float64   `json:"recall_rate" db:"recall_rate"`
}

// TopicMastery represents mastery metrics for a concept
type TopicMastery struct {
	ConceptID     int64   `json:"concept_id" db:"concept_id"`
	ConceptTitle  string  `json:"concept_title" db:"concept_title"`
	ProblemCount  int     `json:"problem_count" db:"problem_count"`
	AvgEase       float64 `json:"avg_ease" db:"avg_ease"`
	AvgInterval   float64 `json:"avg_interval" db:"avg_interval"`
	RetentionRate float64 `json:"retention_rate" db:"retention_rate"`
	MasteryScore  int     `json:"mastery_score" db:"mastery_score"`
}
