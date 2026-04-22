package srs

import (
	"math"
	"time"
)

const (
	minEaseFactor = 1.3
	maxEaseFactor = 3.0
	startingEase  = 2.5
)

type ReviewInput struct {
	Rating          string
	CurrentInterval int
	CurrentEase     float64
	CurrentStreak   int
	Difficulty      string
	Now             time.Time
}

type ReviewResult struct {
	NextReviewAt time.Time
	IntervalDays int
	EaseFactor   float64
	Streak       int
}

func CalculateReview(input ReviewInput) ReviewResult {
	now := input.Now
	if now.IsZero() {
		now = time.Now()
	}

	currentEase := clampEase(input.CurrentEase)
	learningStage := isLearningStage(input.CurrentInterval, input.CurrentStreak)

	newInterval := 0
	newEase := currentEase
	newStreak := input.CurrentStreak

	switch input.Rating {
	case "AGAIN":
		newStreak = 0
		if !learningStage {
			newEase = math.Max(minEaseFactor, currentEase-0.20)
		}

	case "HARD":
		newStreak++
		if learningStage {
			newInterval = learningInterval(newStreak, input.Rating, input.Difficulty)
			break
		}
		newInterval = scaledInterval(input.CurrentInterval, 1.2)
		newEase = math.Max(minEaseFactor, currentEase-0.15)

	case "GOOD":
		newStreak++
		if learningStage {
			newInterval = learningInterval(newStreak, input.Rating, input.Difficulty)
			break
		}
		newInterval = scaledInterval(input.CurrentInterval, currentEase*difficultyMultiplier(input.Difficulty))

	case "EASY":
		newStreak++
		newEase = math.Min(maxEaseFactor, currentEase+0.15)
		if learningStage {
			newInterval = learningInterval(newStreak, input.Rating, input.Difficulty)
			break
		}
		newInterval = scaledInterval(input.CurrentInterval, currentEase*1.3*difficultyMultiplier(input.Difficulty))
	}

	return ReviewResult{
		NextReviewAt: now.AddDate(0, 0, newInterval),
		IntervalDays: newInterval,
		EaseFactor:   newEase,
		Streak:       newStreak,
	}
}

func clampEase(ease float64) float64 {
	if ease == 0 {
		return startingEase
	}
	return math.Min(maxEaseFactor, math.Max(minEaseFactor, ease))
}

func isLearningStage(currentInterval int, currentStreak int) bool {
	return currentStreak < 2
}

func learningInterval(successStreak int, rating string, difficulty string) int {
	var base int

	switch successStreak {
	case 1:
		switch rating {
		case "EASY":
			base = 3
		default:
			base = 1
		}
	case 2:
		switch rating {
		case "HARD":
			base = 3
		case "EASY":
			base = 8
		default:
			base = 6
		}
	default:
		base = 6
	}

	if rating == "GOOD" || rating == "EASY" {
		return scaledInterval(base, difficultyMultiplier(difficulty))
	}

	return base
}

func difficultyMultiplier(difficulty string) float64 {
	switch difficulty {
	case "EASY":
		return 1.15
	case "HARD":
		return 0.75
	default:
		return 1.0
	}
}

func scaledInterval(interval int, multiplier float64) int {
	scaled := int(math.Ceil(float64(interval) * multiplier))
	if scaled < 1 {
		return 1
	}
	return scaled
}
