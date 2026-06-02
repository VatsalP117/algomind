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

func TestCalculateReviewHardLearningStage(t *testing.T) {
	now := time.Date(2026, time.April, 22, 12, 0, 0, 0, time.UTC)

	result := CalculateReview(ReviewInput{
		Rating:          "HARD",
		CurrentInterval: 1,
		CurrentEase:     2.5,
		CurrentStreak:   1,
		Now:             now,
	})

	if result.IntervalDays != 3 {
		t.Fatalf("expected interval 3 for hard learning stage, got %d", result.IntervalDays)
	}
	if result.Streak != 2 {
		t.Fatalf("expected streak 2, got %d", result.Streak)
	}
	if result.EaseFactor != 2.5 {
		t.Fatalf("expected ease unchanged in learning stage, got %.2f", result.EaseFactor)
	}
}

func TestCalculateReviewHardMatureStage(t *testing.T) {
	now := time.Date(2026, time.April, 22, 12, 0, 0, 0, time.UTC)

	result := CalculateReview(ReviewInput{
		Rating:          "HARD",
		CurrentInterval: 10,
		CurrentEase:     2.5,
		CurrentStreak:   3,
		Now:             now,
	})

	wantInterval := scaledInterval(10, 1.2)
	if result.IntervalDays != wantInterval {
		t.Fatalf("expected interval %d, got %d", wantInterval, result.IntervalDays)
	}
	if result.EaseFactor != 2.35 {
		t.Fatalf("expected ease lowered to 2.35, got %.2f", result.EaseFactor)
	}
	if result.Streak != 4 {
		t.Fatalf("expected streak 4, got %d", result.Streak)
	}
}

func TestCalculateReviewGoodMatureStage(t *testing.T) {
	now := time.Date(2026, time.April, 22, 12, 0, 0, 0, time.UTC)

	result := CalculateReview(ReviewInput{
		Rating:          "GOOD",
		CurrentInterval: 10,
		CurrentEase:     2.5,
		CurrentStreak:   3,
		Now:             now,
	})

	wantInterval := scaledInterval(10, 2.5)
	if result.IntervalDays != wantInterval {
		t.Fatalf("expected interval %d, got %d", wantInterval, result.IntervalDays)
	}
	if result.EaseFactor != 2.5 {
		t.Fatalf("expected ease unchanged, got %.2f", result.EaseFactor)
	}
}

func TestCalculateReviewEasyLearningStage(t *testing.T) {
	now := time.Date(2026, time.April, 22, 12, 0, 0, 0, time.UTC)

	result := CalculateReview(ReviewInput{
		Rating:          "EASY",
		CurrentInterval: 1,
		CurrentEase:     2.5,
		CurrentStreak:   1,
		Now:             now,
	})

	if result.IntervalDays != 8 {
		t.Fatalf("expected interval 8 for easy second success, got %d", result.IntervalDays)
	}
	if result.Streak != 2 {
		t.Fatalf("expected streak 2, got %d", result.Streak)
	}
}

func TestCalculateReviewZeroTimeDefaultsToNow(t *testing.T) {
	before := time.Now()
	result := CalculateReview(ReviewInput{
		Rating:          "AGAIN",
		CurrentInterval: 1,
		CurrentEase:     2.5,
		CurrentStreak:   1,
	})
	after := time.Now()

	if result.NextReviewAt.Before(before) || result.NextReviewAt.After(after) {
		t.Fatalf("expected NextReviewAt to default to now, got %s", result.NextReviewAt)
	}
}

func TestCalculateReviewUnknownRating(t *testing.T) {
	now := time.Date(2026, time.April, 22, 12, 0, 0, 0, time.UTC)

	result := CalculateReview(ReviewInput{
		Rating:          "UNKNOWN",
		CurrentInterval: 10,
		CurrentEase:     2.5,
		CurrentStreak:   3,
		Now:             now,
	})

	if result.IntervalDays != 0 {
		t.Fatalf("expected interval 0 for unknown rating, got %d", result.IntervalDays)
	}
	if result.Streak != 3 {
		t.Fatalf("expected streak unchanged for unknown rating, got %d", result.Streak)
	}
	if result.EaseFactor != 2.5 {
		t.Fatalf("expected ease unchanged for unknown rating, got %.2f", result.EaseFactor)
	}
}

func TestClampEase(t *testing.T) {
	t.Run("zero returns starting ease", func(t *testing.T) {
		if clampEase(0) != startingEase {
			t.Fatalf("expected %.1f for zero, got %.1f", startingEase, clampEase(0))
		}
	})
	t.Run("below min clamps to min", func(t *testing.T) {
		if clampEase(1.0) != minEaseFactor {
			t.Fatalf("expected %.1f, got %.1f", minEaseFactor, clampEase(1.0))
		}
	})
	t.Run("above max clamps to max", func(t *testing.T) {
		if clampEase(5.0) != maxEaseFactor {
			t.Fatalf("expected %.1f, got %.1f", maxEaseFactor, clampEase(5.0))
		}
	})
	t.Run("valid value passes through", func(t *testing.T) {
		if clampEase(2.5) != 2.5 {
			t.Fatalf("expected 2.5, got %.1f", clampEase(2.5))
		}
	})
}

func TestIsLearningStage(t *testing.T) {
	if !isLearningStage(10, 1) {
		t.Fatal("expected learning stage for streak 1")
	}
	if isLearningStage(10, 2) {
		t.Fatal("expected not learning stage for streak 2")
	}
	if !isLearningStage(1, 0) {
		t.Fatal("expected learning stage for streak 0")
	}
	if !isLearningStage(1, -1) {
		t.Fatal("expected learning stage for streak -1")
	}
}

func TestLearningIntervalHardSecondSuccess(t *testing.T) {
	result := learningInterval(2, "HARD", "MEDIUM")
	if result != 3 {
		t.Fatalf("expected interval 3 for hard second success, got %d", result)
	}
}

func TestScaledIntervalMinimumOne(t *testing.T) {
	if scaledInterval(0, 0.5) != 1 {
		t.Fatalf("expected minimum interval 1, got %d", scaledInterval(0, 0.5))
	}
}

func TestDifficultyMultiplier(t *testing.T) {
	if difficultyMultiplier("EASY") != 1.15 {
		t.Fatalf("expected 1.15 for EASY, got %.2f", difficultyMultiplier("EASY"))
	}
	if difficultyMultiplier("HARD") != 0.75 {
		t.Fatalf("expected 0.75 for HARD, got %.2f", difficultyMultiplier("HARD"))
	}
	if difficultyMultiplier("MEDIUM") != 1.0 {
		t.Fatalf("expected 1.0 for MEDIUM, got %.2f", difficultyMultiplier("MEDIUM"))
	}
	if difficultyMultiplier("UNKNOWN") != 1.0 {
		t.Fatalf("expected 1.0 for UNKNOWN, got %.2f", difficultyMultiplier("UNKNOWN"))
	}
}
