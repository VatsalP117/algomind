package srs

import (
	"math"
	"time"
)

type ReviewResult struct {
	NextReviewAt time.Time
	IntervalDays int
	EaseFactor   float64
	Streak       int
}

func CalculateReview(rating string, currentInterval int, currentEase float64, currentStreak int) ReviewResult {
	var newInterval int
	var newEase = currentEase
	var newStreak = currentStreak

	switch rating {
	case "AGAIN":
		newInterval = 0
		newStreak = 0
		newEase = math.Max(1.3, currentEase-0.20)

	case "HARD":
		newInterval = int(float64(currentInterval) * 1.2)
		if newInterval == 0 {
			newInterval = 1
		}
		newEase = math.Max(1.3, currentEase-0.15)
		newStreak++

	case "GOOD":
		newInterval = int(float64(currentInterval) * currentEase)
		if newInterval == 0 {
			newInterval = 1
		}
		newStreak++

	case "EASY":
		newInterval = int(float64(currentInterval) * currentEase * 1.3)
		if newInterval == 0 {
			newInterval = 4
		}
		newEase += 0.15
		newStreak++
	}

	nextReview := time.Now().AddDate(0, 0, newInterval)

	return ReviewResult{
		NextReviewAt: nextReview,
		IntervalDays: newInterval,
		EaseFactor:   newEase,
		Streak:       newStreak,
	}
}
