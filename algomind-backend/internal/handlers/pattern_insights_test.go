package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/labstack/echo/v4"
)

type fakePatternInsightsService struct {
	getInsights func(ctx context.Context, userID string) (*dto.PatternInsightsResponse, error)
}

func (f *fakePatternInsightsService) GetInsights(ctx context.Context, userID string) (*dto.PatternInsightsResponse, error) {
	return f.getInsights(ctx, userID)
}

func performInsightsRequest(t *testing.T, service patternInsightsService) *httptest.ResponseRecorder {
	t.Helper()
	e := echo.New()
	handler := NewPatternInsightsHandler(service)

	req := httptest.NewRequest(http.MethodGet, "/patterns/insights", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "user-1")

	handlerErr := handler.GetInsights(c)
	if handlerErr != nil {
		e.HTTPErrorHandler(handlerErr, c)
	}
	return rec
}

func TestGetPatternInsightsSuccess(t *testing.T) {
	service := &fakePatternInsightsService{getInsights: func(ctx context.Context, userID string) (*dto.PatternInsightsResponse, error) {
		if userID != "user-1" {
			t.Errorf("unexpected user: %s", userID)
		}
		return &dto.PatternInsightsResponse{
			Patterns: []dto.PatternInsight{
				{
					PatternID:       1,
					Name:            "Two Pointers",
					ConfirmedCount:  2,
					DueCount:        1,
					RecognizedCount: 3,
					Attempts:        4,
					Label:           stringPtr("Strong"),
				},
			},
			Edges: []dto.PatternEdge{
				{SourcePatternID: 1, TargetPatternID: 2, SharedProblemCount: 1},
			},
		}, nil
	}}

	rec := performInsightsRequest(t, service)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var response dto.PatternInsightsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(response.Patterns) != 1 || response.Patterns[0].Name != "Two Pointers" {
		t.Errorf("unexpected patterns: %+v", response.Patterns)
	}
	if len(response.Edges) != 1 || response.Edges[0].SharedProblemCount != 1 {
		t.Errorf("unexpected edges: %+v", response.Edges)
	}
}

func TestGetPatternInsightsEmptyArraysSerializeAsBrackets(t *testing.T) {
	service := &fakePatternInsightsService{getInsights: func(ctx context.Context, userID string) (*dto.PatternInsightsResponse, error) {
		return &dto.PatternInsightsResponse{
			Patterns: []dto.PatternInsight{},
			Edges:    []dto.PatternEdge{},
		}, nil
	}}

	rec := performInsightsRequest(t, service)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	body := rec.Body.String()
	if strings.Contains(body, "null") {
		t.Errorf("empty arrays must serialize as [] not null: %s", body)
	}
	if !strings.Contains(body, `"patterns":[]`) || !strings.Contains(body, `"edges":[]`) {
		t.Errorf("expected empty arrays in response: %s", body)
	}
}

func TestGetPatternInsightsErrorPropagates(t *testing.T) {
	service := &fakePatternInsightsService{getInsights: func(ctx context.Context, userID string) (*dto.PatternInsightsResponse, error) {
		return nil, errors.New("db exploded with secrets")
	}}

	rec := performInsightsRequest(t, service)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rec.Code)
	}
	// The user-facing body must not leak internal error details.
	if strings.Contains(rec.Body.String(), "secrets") || strings.Contains(rec.Body.String(), "exploded") {
		t.Errorf("response leaked internal error: %s", rec.Body.String())
	}
}

func stringPtr(value string) *string {
	return &value
}
