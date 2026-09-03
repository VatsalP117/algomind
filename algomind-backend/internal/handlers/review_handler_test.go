package handlers

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/repositories"
	"github.com/VatsalP117/algomind/algomind-backend/internal/reviews"
	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

// fakeReviewRepo implements repositories.ReviewRepository without a DB.
type fakeReviewRepo struct {
	getQueue               func(ctx context.Context, userID string, patternID *int64) ([]dto.ReviewQueueItem, error)
	getState               func(ctx context.Context, userID, entityType, entityID string) (*repositories.ReviewStateWithDifficulty, error)
	updateState            func(ctx context.Context, tx *sqlx.Tx, userID, entityType, entityID string, nextReviewAt time.Time, intervalDays int, easeFactor float64, streak int) error
	resetConceptForProblem func(ctx context.Context, tx *sqlx.Tx, userID, problemID string) error
}

func (f *fakeReviewRepo) GetQueue(ctx context.Context, userID string, patternID *int64) ([]dto.ReviewQueueItem, error) {
	return f.getQueue(ctx, userID, patternID)
}

func (f *fakeReviewRepo) GetState(ctx context.Context, userID, entityType, entityID string) (*repositories.ReviewStateWithDifficulty, error) {
	return f.getState(ctx, userID, entityType, entityID)
}

func (f *fakeReviewRepo) UpdateState(ctx context.Context, tx *sqlx.Tx, userID, entityType, entityID string, nextReviewAt time.Time, intervalDays int, easeFactor float64, streak int) error {
	return f.updateState(ctx, tx, userID, entityType, entityID, nextReviewAt, intervalDays, easeFactor, streak)
}

func (f *fakeReviewRepo) ResetConceptForProblem(ctx context.Context, tx *sqlx.Tx, userID, problemID string) error {
	return f.resetConceptForProblem(ctx, tx, userID, problemID)
}

func newReviewTestHandler(repo repositories.ReviewRepository) *ReviewHandler {
	return NewReviewHandler(reviews.NewService(&database.Service{}, repo, nil, nil))
}

func performQueueRequest(t *testing.T, handler *ReviewHandler, rawQuery string) *httptest.ResponseRecorder {
	t.Helper()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/reviews/queue?"+rawQuery, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "user-1")

	handlerErr := handler.GetQueue(c)
	if handlerErr != nil {
		e.HTTPErrorHandler(handlerErr, c)
	}
	return rec
}

func TestGetQueueNoFilterKeepsExistingBehavior(t *testing.T) {
	handler := newReviewTestHandler(&fakeReviewRepo{
		getQueue: func(ctx context.Context, userID string, patternID *int64) ([]dto.ReviewQueueItem, error) {
			if userID != "user-1" {
				t.Errorf("unexpected user %s", userID)
			}
			if patternID != nil {
				t.Errorf("expected nil pattern filter, got %d", *patternID)
			}
			return []dto.ReviewQueueItem{}, nil
		},
	})

	rec := performQueueRequest(t, handler, "")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestGetQueuePatternFilterPassthrough(t *testing.T) {
	var gotPattern *int64
	handler := newReviewTestHandler(&fakeReviewRepo{
		getQueue: func(ctx context.Context, userID string, patternID *int64) ([]dto.ReviewQueueItem, error) {
			gotPattern = patternID
			return []dto.ReviewQueueItem{}, nil
		},
	})

	rec := performQueueRequest(t, handler, "pattern_id=42")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if gotPattern == nil || *gotPattern != 42 {
		t.Fatalf("expected pattern filter 42, got %+v", gotPattern)
	}
}

func TestGetQueueRejectsMalformedPatternID(t *testing.T) {
	handler := newReviewTestHandler(&fakeReviewRepo{
		getQueue: func(ctx context.Context, userID string, patternID *int64) ([]dto.ReviewQueueItem, error) {
			t.Errorf("repository must not run for a malformed pattern_id")
			return nil, nil
		},
	})

	for _, query := range []string{"pattern_id=abc", "pattern_id=-5", "pattern_id=0", "pattern_id=1.5"} {
		rec := performQueueRequest(t, handler, query)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for %q, got %d: %s", query, rec.Code, rec.Body.String())
		}
	}
}

func TestGetQueuePropagatesRepositoryError(t *testing.T) {
	handler := newReviewTestHandler(&fakeReviewRepo{
		getQueue: func(ctx context.Context, userID string, patternID *int64) ([]dto.ReviewQueueItem, error) {
			return nil, errors.New("upstream exploded")
		},
	})

	rec := performQueueRequest(t, handler, "")
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rec.Code)
	}
}
