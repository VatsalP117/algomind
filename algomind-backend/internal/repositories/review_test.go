package repositories

import (
	"reflect"
	"testing"

	"github.com/jmoiron/sqlx/reflectx"
)

func TestReviewStateWithDifficultyMapsGetStateColumns(t *testing.T) {
	columns := []string{"interval_days", "ease_factor", "streak", "difficulty"}
	traversals := reflectx.NewMapper("db").TraversalsByName(
		reflect.TypeOf(ReviewStateWithDifficulty{}),
		columns,
	)

	for i, traversal := range traversals {
		if len(traversal) == 0 {
			t.Errorf("column %q does not map to ReviewStateWithDifficulty", columns[i])
		}
	}
}
