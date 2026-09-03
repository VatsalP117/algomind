package repositories

import (
	"reflect"
	"testing"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/jmoiron/sqlx/reflectx"
)

// TestPatternInsightRowMapsInsightsColumns guards the SELECT aliases in
// PostgresPatternRepository.GetInsights against struct/column drift.
func TestPatternInsightRowMapsInsightsColumns(t *testing.T) {
	columns := []string{
		"pattern_id",
		"name",
		"confirmed_count",
		"due_count",
		"recognized_count",
		"partial_count",
		"missed_count",
		"attempts",
	}
	traversals := reflectx.NewMapper("db").TraversalsByName(
		reflect.TypeOf(dto.PatternInsightRow{}),
		columns,
	)
	for i, traversal := range traversals {
		if len(traversal) == 0 {
			t.Errorf("column %q does not map to dto.PatternInsightRow", columns[i])
		}
	}
}

func TestPatternEdgeMapsEdgesColumns(t *testing.T) {
	columns := []string{
		"source_pattern_id",
		"target_pattern_id",
		"shared_problem_count",
	}
	traversals := reflectx.NewMapper("db").TraversalsByName(
		reflect.TypeOf(dto.PatternEdge{}),
		columns,
	)
	for i, traversal := range traversals {
		if len(traversal) == 0 {
			t.Errorf("column %q does not map to dto.PatternEdge", columns[i])
		}
	}
}

// TestReviewQueueItemMapsQueueColumns keeps both the unfiltered and
// pattern-filtered queue SELECTs aligned with the DTO row shape.
func TestReviewQueueItemMapsQueueColumns(t *testing.T) {
	columns := []string{
		"entity_type",
		"entity_id",
		"next_review_at",
		"problem_title",
		"difficulty",
		"summary",
		"description",
		"answer",
		"answer_language",
		"hints",
		"concept_title",
		"content",
		"pattern_names",
	}
	traversals := reflectx.NewMapper("db").TraversalsByName(
		reflect.TypeOf(dto.ReviewQueueItem{}),
		columns,
	)
	for i, traversal := range traversals {
		if len(traversal) == 0 {
			t.Errorf("column %q does not map to dto.ReviewQueueItem", columns[i])
		}
	}
}
