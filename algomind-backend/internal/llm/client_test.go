package llm

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func validCardJSON() string {
	return `{
		"patterns": [
			{"name": "Two Pointers", "role": "primary", "rationale": "The array is sorted and the solution pairs elements"},
			{"name": "Sliding Window", "role": "supporting", "rationale": "Contiguous subarray scanning"}
		],
		"recognition_cues": ["sorted input array", "O(1) extra space needed"],
		"invariant": "both pointers move monotonically",
		"first_move": "sort the array if not sorted",
		"common_mistake": "moving the wrong pointer",
		"contrasting_pattern": "hash map when the array is unsorted",
		"explanation": "This pattern applies when a sorted array must be paired."
	}`
}

func TestParsePatternCardValid(t *testing.T) {
	result, err := ParsePatternCard(validCardJSON())
	if err != nil {
		t.Fatalf("expected valid card to parse, got error: %v", err)
	}
	if len(result.Patterns) != 2 {
		t.Fatalf("expected 2 patterns, got %d", len(result.Patterns))
	}
	if result.Patterns[0].Role != "primary" || result.Patterns[1].Role != "supporting" {
		t.Errorf("unexpected roles: %q, %q", result.Patterns[0].Role, result.Patterns[1].Role)
	}
	if result.Invariant != "both pointers move monotonically" {
		t.Errorf("unexpected invariant %q", result.Invariant)
	}
	if len(result.RecognitionCues) != 2 {
		t.Errorf("expected 2 recognition cues, got %d", len(result.RecognitionCues))
	}
}

func TestParsePatternCardStripsCodeFences(t *testing.T) {
	raw := "```json\n" + validCardJSON() + "\n```"
	result, err := ParsePatternCard(raw)
	if err != nil {
		t.Fatalf("expected fenced card to parse, got error: %v", err)
	}
	if len(result.Patterns) != 2 {
		t.Errorf("expected 2 patterns after fence strip, got %d", len(result.Patterns))
	}
}

func TestParsePatternCardSurvivesMalformedOutput(t *testing.T) {
	cases := map[string]string{
		"empty":                 "",
		"whitespace":            "   \n\t ",
		"not json":              "definitely not json",
		"json string":           `"hello"`,
		"array":                 `[1, 2, 3]`,
		"empty patterns":        `{"patterns": []}`,
		"missing patterns":      `{"invariant": "x"}`,
		"missing primary":       `{"patterns": [{"name": "A", "role": "supporting", "rationale": "r"}]}`,
		"two primaries":         `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}, {"name": "B", "role": "primary", "rationale": "r"}]}`,
		"four patterns":         `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}, {"name": "B", "role": "supporting", "rationale": "r"}, {"name": "C", "role": "supporting", "rationale": "r"}, {"name": "D", "role": "supporting", "rationale": "r"}]}`,
		"empty pattern name":    `{"patterns": [{"name": " ", "role": "primary", "rationale": "r"}]}`,
		"empty rationale":       `{"patterns": [{"name": "A", "role": "primary", "rationale": ""}]}`,
		"bad role":              `{"patterns": [{"name": "A", "role": "lead", "rationale": "r"}]}`,
		"missing explanation":   `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}]}`,
		"empty first_move":      `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}], "first_move": " "}`,
		"empty cue":             `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}], "recognition_cues": ["ok", " "], "invariant": "i", "first_move": "f", "common_mistake": "m", "contrasting_pattern": "c", "explanation": "e"}`,
		"too long pattern name": `{"patterns": [{"name": "` + strings.Repeat("x", 101) + `", "role": "primary", "rationale": "r"}]}`,
		"too long text field":   `{"patterns": [{"name": "A", "role": "primary", "rationale": "r"}], "invariant": "` + strings.Repeat("x", 5001) + `", "first_move": "f", "common_mistake": "m", "contrasting_pattern": "c", "explanation": "e"}`,
	}

	for name, raw := range cases {
		t.Run(name, func(t *testing.T) {
			result, err := ParsePatternCard(raw)
			if err == nil {
				t.Fatalf("expected error for %q, got result with %d patterns", name, len(result.Patterns))
			}
			if !errors.Is(err, ErrInvalidOutput) {
				t.Errorf("expected error to wrap ErrInvalidOutput, got %v", err)
			}
		})
	}
}

func TestParsePatternCardNormalizes(t *testing.T) {
	raw := `{
		"patterns": [
			{"name": "  Two Pointers  ", "role": "PRIMARY", "rationale": "  pair elements  "}
		],
		"recognition_cues": ["  sorted input ", " sorted input"],
		"invariant": "  monotonic moves ",
		"first_move": " sort first ",
		"common_mistake": " wrong pointer ",
		"contrasting_pattern": " hash map ",
		"explanation": " pairs in sorted array "
	}`
	result, err := ParsePatternCard(raw)
	if err != nil {
		t.Fatalf("expected normalized card to parse, got error: %v", err)
	}
	if result.Patterns[0].Name != "Two Pointers" {
		t.Errorf("expected trimmed name, got %q", result.Patterns[0].Name)
	}
	if result.Patterns[0].Role != "primary" {
		t.Errorf("expected lowercased role, got %q", result.Patterns[0].Role)
	}
	if len(result.RecognitionCues) != 1 {
		t.Errorf("expected duplicate cue dropped, got %d cues", len(result.RecognitionCues))
	}
	if result.Invariant != "monotonic moves" {
		t.Errorf("expected trimmed invariant, got %q", result.Invariant)
	}
}

func TestGeneratePatternCardUsesJSONMode(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/chat/completions" {
			t.Errorf("unexpected request path %q", r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer test-key" {
			t.Errorf("unexpected authorization header %q", got)
		}

		var request chatCompletionRequest
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if request.Model != "deepseek-v4-flash" {
			t.Errorf("unexpected model %q", request.Model)
		}
		if request.ResponseFormat == nil || request.ResponseFormat.Type != "json_object" {
			t.Errorf("expected JSON response format, got %+v", request.ResponseFormat)
		}
		if !strings.Contains(request.Messages[0].Content, "ONLY a single valid JSON object") {
			t.Error("system prompt does not require JSON-only output")
		}
		if !strings.Contains(request.Messages[1].Content, "UNTRUSTED DATA") {
			t.Error("user prompt does not mark problem content as untrusted")
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(chatCompletionResponse{
			Choices: []struct {
				Message chatMessage `json:"message"`
			}{{Message: chatMessage{Role: "assistant", Content: validCardJSON()}}},
		})
	}))
	defer server.Close()

	client := &Client{
		baseURL: server.URL,
		apiKey:  "test-key",
		model:   "deepseek-v4-flash",
		httpClient: &http.Client{
			Timeout: time.Second,
		},
	}
	result, err := client.GeneratePatternCard(context.Background(), RequestMetadata{
		UserID:    "user-1",
		ProblemID: 42,
	}, PatternCardRequest{
		Title:    "Two Sum",
		Summary:  "Find a pair",
		Solution: "Use a hash map",
	})
	if err != nil {
		t.Fatalf("generate pattern card: %v", err)
	}
	if len(result.Patterns) != 2 || result.Patterns[0].Name != "Two Pointers" {
		t.Fatalf("unexpected result: %+v", result)
	}
}
