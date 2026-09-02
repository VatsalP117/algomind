package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/llm"
	"github.com/VatsalP117/algomind/algomind-backend/internal/models"
	"github.com/VatsalP117/algomind/algomind-backend/internal/patterns"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

type fakePatternCardService struct {
	getPatternCard      func(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error)
	generatePatternCard func(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error)
	updatePatternCard   func(ctx context.Context, userID string, problemID int64, req dto.PatternCardUpdateRequest) (*dto.PatternCardResponse, error)
}

func (f *fakePatternCardService) GetPatternCard(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
	return f.getPatternCard(ctx, userID, problemID)
}

func (f *fakePatternCardService) GeneratePatternCard(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
	return f.generatePatternCard(ctx, userID, problemID)
}

func (f *fakePatternCardService) UpdatePatternCard(ctx context.Context, userID string, problemID int64, req dto.PatternCardUpdateRequest) (*dto.PatternCardResponse, error) {
	return f.updatePatternCard(ctx, userID, problemID, req)
}

func newPatternCardTestServer(t *testing.T, service patternCardService) (*echo.Echo, *PatternCardHandler) {
	t.Helper()
	e := echo.New()
	e.Validator = &echoValidator{validate: validator.New()}
	handler := NewPatternCardHandler(service)
	return e, handler
}

// echoValidator mirrors server.CustomValidator without importing server
// (which would create an import cycle in tests).
type echoValidator struct {
	validate *validator.Validate
}

func (v *echoValidator) Validate(i interface{}) error {
	return v.validate.Struct(i)
}

func performPatternCardRequest(t *testing.T, e *echo.Echo, handler *PatternCardHandler, method, path, params, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	if params != "" {
		c.SetParamNames("problem_id")
		c.SetParamValues(params)
	}
	c.Set("user_id", "user-1")
	var handlerErr error
	switch method {
	case http.MethodGet:
		handlerErr = handler.GetPatternCard(c)
	case http.MethodPost:
		handlerErr = handler.GeneratePatternCard(c)
	case http.MethodPut:
		handlerErr = handler.UpdatePatternCard(c)
	}
	if handlerErr != nil {
		// Mirror the real server: errors flow through the HTTP error
		// handler, which writes the JSON error response.
		e.HTTPErrorHandler(handlerErr, c)
	}
	return rec
}

func sampleCard() *dto.PatternCardResponse {
	return &dto.PatternCardResponse{
		ProblemID: 42,
		Status:    "confirmed",
		Patterns: []dto.PatternCardPattern{
			{Name: "Two Pointers", Role: "primary", Rationale: "pairs"},
		},
		RecognitionCues:    models.JSONStringArray{"sorted"},
		Invariant:          "monotonic moves",
		FirstMove:          "sort first",
		CommonMistake:      "wrong pointer",
		ContrastingPattern: "hash map",
		Explanation:        "pairs in sorted arrays",
		CreatedAt:          time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
		UpdatedAt:          time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC),
		RelatedProblems:    []dto.RelatedProblem{},
	}
}

func TestGetPatternCardSuccess(t *testing.T) {
	service := &fakePatternCardService{getPatternCard: func(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
		if userID != "user-1" || problemID != 42 {
			t.Errorf("unexpected args: user=%s problem=%d", userID, problemID)
		}
		return sampleCard(), nil
	}}
	e, handler := newPatternCardTestServer(t, service)

	rec := performPatternCardRequest(t, e, handler, http.MethodGet, "/problems/42/pattern-card", "42", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var response dto.PatternCardResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if response.ProblemID != 42 || response.Status != "confirmed" {
		t.Errorf("unexpected response: %+v", response)
	}
	if len(response.Patterns) != 1 || response.Patterns[0].Name != "Two Pointers" {
		t.Errorf("unexpected patterns: %+v", response.Patterns)
	}
}

func TestGetPatternCardNotFound(t *testing.T) {
	service := &fakePatternCardService{getPatternCard: func(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
		return nil, patterns.ErrProblemNotFound
	}}
	e, handler := newPatternCardTestServer(t, service)

	rec := performPatternCardRequest(t, e, handler, http.MethodGet, "/problems/99/pattern-card", "99", "")
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
	if strings.Contains(rec.Body.String(), "user-1") {
		t.Errorf("response leaked user data: %s", rec.Body.String())
	}
}

func TestGetPatternCardCardNotFound(t *testing.T) {
	service := &fakePatternCardService{getPatternCard: func(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
		return nil, patterns.ErrCardNotFound
	}}
	e, handler := newPatternCardTestServer(t, service)

	rec := performPatternCardRequest(t, e, handler, http.MethodGet, "/problems/42/pattern-card", "42", "")
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
}

func TestGetPatternCardInvalidID(t *testing.T) {
	service := &fakePatternCardService{getPatternCard: func(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
		t.Errorf("service should not be called for invalid ID")
		return nil, nil
	}}
	e, handler := newPatternCardTestServer(t, service)

	rec := performPatternCardRequest(t, e, handler, http.MethodGet, "/problems/abc/pattern-card", "abc", "")
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestGeneratePatternCardNotConfigured(t *testing.T) {
	service := &fakePatternCardService{generatePatternCard: func(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
		return nil, patterns.ErrLLMNotConfigured
	}}
	e, handler := newPatternCardTestServer(t, service)

	rec := performPatternCardRequest(t, e, handler, http.MethodPost, "/problems/42/pattern-card/generate", "42", "")
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestGeneratePatternCardInvalidOutput(t *testing.T) {
	service := &fakePatternCardService{generatePatternCard: func(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
		return nil, errors.Join(llm.ErrInvalidOutput, errors.New("boom: detailed provider failure here"))
	}}
	e, handler := newPatternCardTestServer(t, service)

	rec := performPatternCardRequest(t, e, handler, http.MethodPost, "/problems/42/pattern-card/generate", "42", "")
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected 502, got %d", rec.Code)
	}
	// The user-facing body must not leak provider details.
	if strings.Contains(rec.Body.String(), "boom") || strings.Contains(rec.Body.String(), "provider") {
		t.Errorf("response leaked provider details: %s", rec.Body.String())
	}
}

func TestGeneratePatternCardProviderFailure(t *testing.T) {
	service := &fakePatternCardService{generatePatternCard: func(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error) {
		return nil, errors.New("upstream 500 with secrets")
	}}
	e, handler := newPatternCardTestServer(t, service)

	rec := performPatternCardRequest(t, e, handler, http.MethodPost, "/problems/42/pattern-card/generate", "42", "")
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected 502, got %d", rec.Code)
	}
	if strings.Contains(rec.Body.String(), "upstream") || strings.Contains(rec.Body.String(), "secrets") {
		t.Errorf("response leaked provider details: %s", rec.Body.String())
	}
}

func TestUpdatePatternCardSuccess(t *testing.T) {
	service := &fakePatternCardService{updatePatternCard: func(ctx context.Context, userID string, problemID int64, req dto.PatternCardUpdateRequest) (*dto.PatternCardResponse, error) {
		if problemID != 42 {
			t.Errorf("unexpected problem ID %d", problemID)
		}
		if len(req.Patterns) != 1 || req.Patterns[0].Role != "primary" {
			t.Errorf("unexpected request patterns: %+v", req.Patterns)
		}
		return sampleCard(), nil
	}}
	e, handler := newPatternCardTestServer(t, service)

	body := `{
		"patterns": [{"name": "Two Pointers", "role": "primary", "rationale": "pairs"}],
		"recognition_cues": ["sorted"],
		"invariant": "monotonic moves",
		"first_move": "sort first",
		"common_mistake": "wrong pointer",
		"contrasting_pattern": "hash map",
		"explanation": "pairs in sorted arrays"
	}`
	rec := performPatternCardRequest(t, e, handler, http.MethodPut, "/problems/42/pattern-card", "42", body)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestUpdatePatternCardInvalidJSON(t *testing.T) {
	service := &fakePatternCardService{updatePatternCard: func(ctx context.Context, userID string, problemID int64, req dto.PatternCardUpdateRequest) (*dto.PatternCardResponse, error) {
		t.Errorf("service should not be called for invalid JSON")
		return nil, nil
	}}
	e, handler := newPatternCardTestServer(t, service)

	rec := performPatternCardRequest(t, e, handler, http.MethodPut, "/problems/42/pattern-card", "42", "{not json")
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestUpdatePatternCardRejectsInvalidPatterns(t *testing.T) {
	// These violate the DTO validation tags, so the service must never
	// be invoked.
	cases := map[string]string{
		"empty patterns":   `{"patterns": []}`,
		"bad role":         `{"patterns": [{"name": "A", "role": "lead", "rationale": "r"}]}`,
		"missing patterns": `{}`,
		"four patterns":    `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}, {"name": "B", "role": "supporting", "rationale": "r"}, {"name": "C", "role": "supporting", "rationale": "r"}, {"name": "D", "role": "supporting", "rationale": "r"}]}`,
		"bad recognition":  `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}], "recognition_cues": ["ok", "` + strings.Repeat("x", 201) + `"]}`,
		"too many cues":    `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}], "recognition_cues": ["1","2","3","4","5","6","7","8","9","10","11"]}`,
		"long invariant":   `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}], "invariant": "` + strings.Repeat("x", 5001) + `"}`,
	}

	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			service := &fakePatternCardService{updatePatternCard: func(ctx context.Context, userID string, problemID int64, req dto.PatternCardUpdateRequest) (*dto.PatternCardResponse, error) {
				t.Errorf("service should not be called for invalid request")
				return nil, nil
			}}
			e, handler := newPatternCardTestServer(t, service)

			rec := performPatternCardRequest(t, e, handler, http.MethodPut, "/problems/42/pattern-card", "42", body)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for %q, got %d: %s", name, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestUpdatePatternCardRejectsBusinessRules(t *testing.T) {
	// These pass the DTO tags but violate business normalization rules
	// (blank name, missing primary after normalization), so the service
	// returns ErrInvalidPatterns and the handler maps it to 400.
	cases := map[string]string{
		"blank name":      `{"patterns": [{"name": " ", "role": "primary", "rationale": "r"}]}`,
		"missing primary": `{"patterns": [{"name": "A", "role": "supporting", "rationale": "r"}]}`,
	}

	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			service := &fakePatternCardService{updatePatternCard: func(ctx context.Context, userID string, problemID int64, req dto.PatternCardUpdateRequest) (*dto.PatternCardResponse, error) {
				return nil, patterns.ErrInvalidPatterns
			}}
			e, handler := newPatternCardTestServer(t, service)

			rec := performPatternCardRequest(t, e, handler, http.MethodPut, "/problems/42/pattern-card", "42", body)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for %q, got %d: %s", name, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestUpdatePatternCardServiceRejects(t *testing.T) {
	service := &fakePatternCardService{updatePatternCard: func(ctx context.Context, userID string, problemID int64, req dto.PatternCardUpdateRequest) (*dto.PatternCardResponse, error) {
		return nil, patterns.ErrInvalidPatterns
	}}
	e, handler := newPatternCardTestServer(t, service)

	body := `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}]}`
	rec := performPatternCardRequest(t, e, handler, http.MethodPut, "/problems/42/pattern-card", "42", body)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestUpdatePatternCardProblemNotFound(t *testing.T) {
	service := &fakePatternCardService{updatePatternCard: func(ctx context.Context, userID string, problemID int64, req dto.PatternCardUpdateRequest) (*dto.PatternCardResponse, error) {
		return nil, patterns.ErrProblemNotFound
	}}
	e, handler := newPatternCardTestServer(t, service)

	body := `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}]}`
	rec := performPatternCardRequest(t, e, handler, http.MethodPut, "/problems/99/pattern-card", "99", body)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
}
