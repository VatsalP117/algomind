package patterns

import (
	"fmt"
	"math"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
)

// Mastery labels. Conservative by design: no attempts and thin evidence
// never claim mastery.
const (
	labelLearning      = "Learning"
	labelDeveloping    = "Developing"
	labelStrong        = "Strong"
	labelNeedsPractice = "Needs practice"
)

// MasteryScore converts raw recognition evidence into a 0–100 score,
// rounded to one decimal:
//
//	100 * (recognized + 0.5 * partial) / attempts
//
// It returns nil when there are no attempts (attempts <= 0) so callers
// never surface a false "weak" claim backed by zero evidence.
func MasteryScore(attempts, recognized, partial int) *float64 {
	if attempts <= 0 {
		return nil
	}
	score := 100.0 * (float64(recognized) + 0.5*float64(partial)) / float64(attempts)
	rounded := math.Round(score*10) / 10
	return &rounded
}

// MasteryLabel assigns a conservative evidence-based label:
//
//   - nil label when there are no attempts
//   - "Learning" for 1–3 attempts
//   - "Needs practice" when attempts >= 4 and missed/attempts >= 0.5
//   - "Strong" when score >= 70, "Developing" when score >= 50,
//     otherwise "Needs practice"
func MasteryLabel(attempts, missed int, score *float64) *string {
	if attempts <= 0 {
		return nil
	}
	if attempts <= 3 {
		return stringPtr(labelLearning)
	}
	if missed*2 >= attempts {
		return stringPtr(labelNeedsPractice)
	}
	if score == nil {
		return nil
	}
	switch {
	case *score >= 70:
		return stringPtr(labelStrong)
	case *score >= 50:
		return stringPtr(labelDeveloping)
	default:
		return stringPtr(labelNeedsPractice)
	}
}

// WeakInsight returns a study-guidance message for patterns with at
// least 4 attempts and a weak recognition record, or nil otherwise:
//
//   - missed rate >= 0.5: "Missed on M of N pattern checks — re-study the
//     recognition cues."
//   - score < 60: "Recognition is below 60% across N pattern checks."
func WeakInsight(attempts, missed int, score *float64) *string {
	if attempts < 4 {
		// Weak insights only exist once there is meaningful evidence.
		return nil
	}
	if missed*2 >= attempts {
		return stringPtr(fmt.Sprintf("Missed on %d of %d pattern checks \u2014 re-study the recognition cues.", missed, attempts))
	}
	if score != nil && *score < 60 {
		return stringPtr(fmt.Sprintf("Recognition is below 60%% across %d pattern checks.", attempts))
	}
	return nil
}

// BuildPatternInsight derives the mastery score, label and weak insight
// for a raw aggregate row. It is a pure function suitable for table
// tests.
func BuildPatternInsight(row dto.PatternInsightRow) dto.PatternInsight {
	score := MasteryScore(row.Attempts, row.RecognizedCount, row.PartialCount)
	return dto.PatternInsight{
		PatternID:       row.PatternID,
		Name:            row.Name,
		ConfirmedCount:  row.ConfirmedCount,
		DueCount:        row.DueCount,
		RecognizedCount: row.RecognizedCount,
		PartialCount:    row.PartialCount,
		MissedCount:     row.MissedCount,
		Attempts:        row.Attempts,
		MasteryScore:    score,
		Label:           MasteryLabel(row.Attempts, row.MissedCount, score),
		Insight:         WeakInsight(row.Attempts, row.MissedCount, score),
	}
}
