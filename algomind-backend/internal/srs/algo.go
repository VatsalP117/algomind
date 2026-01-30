package srs

import (
	"math"
	"time"
)

// ReviewResult holds the calculated schedule for the item
type ReviewResult struct {
	NextReviewAt time.Time
	IntervalDays int
	EaseFactor   float64
	Streak       int
}

// CalculateReview determines the new schedule based on the rating.
// rating: "AGAIN" (Fail), "HARD", "GOOD", "EASY"
func CalculateReview(rating string, currentInterval int, currentEase float64, currentStreak int) ReviewResult {
	var newInterval int
	var newEase = currentEase
	var newStreak = currentStreak

	switch rating {
	case "AGAIN": // Failed
		newInterval = 0 // Reset to 0 (Due immediately/tomorrow)
		newStreak = 0
		newEase = math.Max(1.3, currentEase-0.20) // Penalty

	case "HARD":
		newInterval = int(float64(currentInterval) * 1.2) // Grow slowly
		if newInterval == 0 {
			newInterval = 1
		}
		newEase = math.Max(1.3, currentEase-0.15)
		newStreak++

	case "GOOD":
		newInterval = int(float64(currentInterval) * currentEase) // Standard growth
		if newInterval == 0 {
			newInterval = 1
		}
		newStreak++

	case "EASY":
		newInterval = int(float64(currentInterval) * currentEase * 1.3) // Bonus growth
		if newInterval == 0 {
			newInterval = 4
		}
		newEase += 0.15
		newStreak++
	}

	// Calculate the actual date: Add 'newInterval' days to NOW
	nextReview := time.Now().AddDate(0, 0, newInterval)

	return ReviewResult{
		NextReviewAt: nextReview,
		IntervalDays: newInterval,
		EaseFactor:   newEase,
		Streak:       newStreak,
	}
}
