package srs

import (
	"testing"
	"time"
)

func TestCalculateReviewLearningAgainPreservesEase(t *testing.T) {
	now := time.Date(2026, time.April, 22, 12, 0, 0, 0, time.UTC)

	result := CalculateReview(ReviewInput{
		Rating:          "AGAIN",
		CurrentInterval: 1,
		CurrentEase:     2.5,
		CurrentStreak:   1,
		Now:             now,
	})

	if result.IntervalDays != 0 {
		t.Fatalf("expected interval 0, got %d", result.IntervalDays)
	}
	if result.EaseFactor != 2.5 {
		t.Fatalf("expected ease to stay at 2.5, got %.2f", result.EaseFactor)
	}
	if result.Streak != 0 {
		t.Fatalf("expected streak reset to 0, got %d", result.Streak)
	}
	if !result.NextReviewAt.Equal(now) {
		t.Fatalf("expected next review at %s, got %s", now, result.NextReviewAt)
	}
}

func TestCalculateReviewSecondSuccessUsesDifficultyAwareIntervals(t *testing.T) {
	now := time.Date(2026, time.April, 22, 12, 0, 0, 0, time.UTC)

	testCases := []struct {
		name       string
		difficulty string
		wantDays   int
	}{
		{name: "hard problem", difficulty: "HARD", wantDays: 5},
		{name: "medium problem", difficulty: "MEDIUM", wantDays: 6},
		{name: "easy problem", difficulty: "EASY", wantDays: 7},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := CalculateReview(ReviewInput{
				Rating:          "GOOD",
				CurrentInterval: 1,
				CurrentEase:     2.5,
				CurrentStreak:   1,
				Difficulty:      tc.difficulty,
				Now:             now,
			})

			if result.IntervalDays != tc.wantDays {
				t.Fatalf("expected interval %d, got %d", tc.wantDays, result.IntervalDays)
			}
			if result.Streak != 2 {
				t.Fatalf("expected streak 2, got %d", result.Streak)
			}
		})
	}
}

func TestCalculateReviewMatureAgainLowersEase(t *testing.T) {
	now := time.Date(2026, time.April, 22, 12, 0, 0, 0, time.UTC)

	result := CalculateReview(ReviewInput{
		Rating:          "AGAIN",
		CurrentInterval: 10,
		CurrentEase:     2.5,
		CurrentStreak:   3,
		Now:             now,
	})

	if result.IntervalDays != 0 {
		t.Fatalf("expected interval 0, got %d", result.IntervalDays)
	}
	if result.EaseFactor != 2.3 {
		t.Fatalf("expected ease 2.3, got %.2f", result.EaseFactor)
	}
	if result.Streak != 0 {
		t.Fatalf("expected streak 0, got %d", result.Streak)
	}
}

func TestCalculateReviewEasyCapsEaseAndRewardsEasyProblems(t *testing.T) {
	now := time.Date(2026, time.April, 22, 12, 0, 0, 0, time.UTC)

	easyProblem := CalculateReview(ReviewInput{
		Rating:          "EASY",
		CurrentInterval: 10,
		CurrentEase:     2.95,
		CurrentStreak:   3,
		Difficulty:      "EASY",
		Now:             now,
	})

	hardProblem := CalculateReview(ReviewInput{
		Rating:          "EASY",
		CurrentInterval: 10,
		CurrentEase:     2.95,
		CurrentStreak:   3,
		Difficulty:      "HARD",
		Now:             now,
	})

	if easyProblem.EaseFactor != 3.0 {
		t.Fatalf("expected easy problem ease capped at 3.0, got %.2f", easyProblem.EaseFactor)
	}
	if easyProblem.IntervalDays <= hardProblem.IntervalDays {
		t.Fatalf("expected easy problem interval %d to be greater than hard problem interval %d", easyProblem.IntervalDays, hardProblem.IntervalDays)
	}
}
