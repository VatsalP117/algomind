package patterns

import (
	"math"
	"testing"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
)

func TestMasteryScore(t *testing.T) {
	cases := []struct {
		name        string
		attempts    int
		recognized  int
		partial     int
		wantScore   float64
		wantPresent bool
	}{
		{name: "no attempts returns nil", attempts: 0, wantPresent: false},
		{name: "negative attempts returns nil", attempts: -1, wantPresent: false},
		{name: "all recognized", attempts: 4, recognized: 4, wantScore: 100, wantPresent: true},
		{name: "all partial", attempts: 2, partial: 2, wantScore: 50, wantPresent: true},
		{name: "all missed", attempts: 3, wantScore: 0, wantPresent: true},
		{name: "mixed rounds to one decimal", attempts: 3, recognized: 1, partial: 2, wantScore: 66.7, wantPresent: true},
		{name: "mixed exact", attempts: 4, recognized: 3, partial: 1, wantScore: 87.5, wantPresent: true},
		{name: "single recognized", attempts: 1, recognized: 1, wantScore: 100, wantPresent: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			score := MasteryScore(tc.attempts, tc.recognized, tc.partial)
			if !tc.wantPresent {
				if score != nil {
					t.Fatalf("expected nil score, got %v", *score)
				}
				return
			}
			if score == nil {
				t.Fatal("expected a score, got nil")
			}
			if math.Abs(*score-tc.wantScore) > 0.0001 {
				t.Errorf("expected score %.1f, got %.1f", tc.wantScore, *score)
			}
		})
	}
}

func TestMasteryLabel(t *testing.T) {
	cases := []struct {
		name      string
		attempts  int
		missed    int
		score     *float64
		wantLabel string
		wantNil   bool
	}{
		{name: "no attempts", attempts: 0, wantNil: true},
		{name: "attempts hides weak evidence", attempts: 1, missed: 1, score: ptr(0), wantLabel: labelLearning},
		{name: "two attempts learning", attempts: 2, score: ptr(100), wantLabel: labelLearning},
		{name: "three attempts learning", attempts: 3, missed: 1, score: ptr(16.7), wantLabel: labelLearning},
		{name: "four attempts strong", attempts: 4, score: ptr(100), wantLabel: labelStrong},
		{name: "four attempts exactly strong threshold", attempts: 4, score: ptr(70), wantLabel: labelStrong},
		{name: "four attempts developing", attempts: 4, missed: 1, score: ptr(62.5), wantLabel: labelDeveloping},
		{name: "four attempts exactly developing threshold", attempts: 4, score: ptr(50), wantLabel: labelDeveloping},
		{name: "four attempts below fifty", attempts: 4, missed: 1, score: ptr(25), wantLabel: labelNeedsPractice},
		{name: "missed rate exactly half forces needs practice", attempts: 4, missed: 2, score: ptr(50), wantLabel: labelNeedsPractice},
		{name: "missed rate above half forces needs practice", attempts: 6, missed: 4, score: ptr(33.3), wantLabel: labelNeedsPractice},
		{name: "nil score with attempts never happens but safe", attempts: 5, wantNil: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			label := MasteryLabel(tc.attempts, tc.missed, tc.score)
			if tc.wantNil {
				if label != nil {
					t.Errorf("expected nil label, got %q", *label)
				}
				return
			}
			if label == nil {
				t.Fatal("expected a label, got nil")
			}
			if *label != tc.wantLabel {
				t.Errorf("expected label %q, got %q", tc.wantLabel, *label)
			}
		})
	}
}

func TestWeakInsight(t *testing.T) {
	cases := []struct {
		name     string
		attempts int
		missed   int
		score    *float64
		want     string
		wantNil  bool
	}{
		{name: "no attempts", attempts: 0, wantNil: true},
		{name: "three attempts never weak", attempts: 3, missed: 3, score: ptr(0), wantNil: true},
		{name: "high miss rate message", attempts: 4, missed: 2, score: ptr(50), want: "Missed on 2 of 4 pattern checks \u2014 re-study the recognition cues."},
		{name: "high miss rate message odd attempts", attempts: 5, missed: 3, score: ptr(40), want: "Missed on 3 of 5 pattern checks \u2014 re-study the recognition cues."},
		{name: "below sixty message", attempts: 4, missed: 1, score: ptr(37.5), want: "Recognition is below 60% across 4 pattern checks."},
		{name: "exactly sixty is not weak", attempts: 4, missed: 1, score: ptr(62.5), wantNil: true},
		{name: "nil score never weak insight", attempts: 4, score: nil, wantNil: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := WeakInsight(tc.attempts, tc.missed, tc.score)
			if tc.wantNil {
				if got != nil {
					t.Errorf("expected nil insight, got %q", *got)
				}
				return
			}
			if got == nil {
				t.Fatalf("expected insight %q, got nil", tc.want)
			}
			if *got != tc.want {
				t.Errorf("expected insight %q, got %q", tc.want, *got)
			}
		})
	}
}

func TestBuildPatternInsight(t *testing.T) {
	insight := BuildPatternInsight(dto.PatternInsightRow{
		PatternID:       7,
		Name:            "Two Pointers",
		ConfirmedCount:  3,
		DueCount:        1,
		RecognizedCount: 3,
		PartialCount:    2,
		MissedCount:     3,
		Attempts:        8,
	})

	if insight.PatternID != 7 || insight.Name != "Two Pointers" {
		t.Errorf("unexpected identity fields: %+v", insight)
	}
	if insight.ConfirmedCount != 3 || insight.DueCount != 1 {
		t.Errorf("unexpected counts: %+v", insight)
	}
	// 100 * (3 + 0.5*2) / 8 = 50
	if insight.MasteryScore == nil || math.Abs(*insight.MasteryScore-50) > 0.0001 {
		t.Errorf("expected mastery 50, got %+v", insight.MasteryScore)
	}
	if insight.Label == nil || *insight.Label != labelDeveloping {
		t.Errorf("expected Developing label, got %+v", insight.Label)
	}
	if insight.Insight == nil || *insight.Insight != "Recognition is below 60% across 8 pattern checks." {
		t.Errorf("expected weak insight, got %+v", insight.Insight)
	}
}

func TestBuildPatternInsightNoEvidence(t *testing.T) {
	insight := BuildPatternInsight(dto.PatternInsightRow{
		PatternID:      9,
		Name:           "Prefix Sum",
		ConfirmedCount: 2,
		Attempts:       0,
	})

	if insight.MasteryScore != nil {
		t.Errorf("expected nil mastery for zero attempts, got %v", *insight.MasteryScore)
	}
	if insight.Label != nil {
		t.Errorf("expected nil label for zero attempts, got %q", *insight.Label)
	}
	if insight.Insight != nil {
		t.Errorf("expected nil insight for zero attempts, got %q", *insight.Insight)
	}
}

func ptr(value float64) *float64 {
	return &value
}
