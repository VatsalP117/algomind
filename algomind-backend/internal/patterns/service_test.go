package patterns

import (
	"errors"
	"fmt"
	"strings"
	"testing"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/llm"
)

func patternsInput(patterns []dto.PatternCardUpdatePattern) []dto.PatternCardUpdatePattern {
	return patterns
}

func TestNormalizePatternsValid(t *testing.T) {
	drafts, err := normalizePatterns(patternsInput([]dto.PatternCardUpdatePattern{
		{Name: "  Two Pointers ", Role: "PRIMARY", Rationale: "  pair elements "},
		{Name: "Sliding Window", Role: "supporting", Rationale: "subarrays"},
		{Name: "Prefix Sum", Role: "supporting", Rationale: "ranges"},
	}))
	if err != nil {
		t.Fatalf("expected valid patterns to normalize, got error: %v", err)
	}
	if len(drafts) != 3 {
		t.Fatalf("expected 3 drafts, got %d", len(drafts))
	}
	if drafts[0].Name != "Two Pointers" {
		t.Errorf("expected trimmed name, got %q", drafts[0].Name)
	}
	if drafts[0].Role != "primary" {
		t.Errorf("expected normalized role, got %q", drafts[0].Role)
	}
	if drafts[1].Rationale != "subarrays" {
		t.Errorf("expected trimmed rationale, got %q", drafts[1].Rationale)
	}
}

func TestNormalizePatternsDedupesCaseInsensitively(t *testing.T) {
	drafts, err := normalizePatterns(patternsInput([]dto.PatternCardUpdatePattern{
		{Name: "Two Pointers", Role: "primary", Rationale: "first"},
		{Name: "two pointers", Role: "supporting", Rationale: "duplicate"},
		{Name: "TWO POINTERS", Role: "supporting", Rationale: "duplicate again"},
	}))
	if err != nil {
		t.Fatalf("expected duplicates to dedupe cleanly, got error: %v", err)
	}
	if len(drafts) != 1 {
		t.Fatalf("expected 1 draft after dedupe, got %d", len(drafts))
	}
	if drafts[0].Name != "Two Pointers" {
		t.Errorf("expected first occurrence kept, got %q", drafts[0].Name)
	}
	if drafts[0].Rationale != "first" {
		t.Errorf("expected first occurrence rationale kept, got %q", drafts[0].Rationale)
	}
}

func TestNormalizePatternsRejectsInvalid(t *testing.T) {
	cases := map[string][]dto.PatternCardUpdatePattern{
		"empty":      {},
		"no primary": {{Name: "A", Role: "supporting", Rationale: "r"}},
		"two primaries": {
			{Name: "A", Role: "primary", Rationale: "r"},
			{Name: "B", Role: "primary", Rationale: "r"},
		},
		"four patterns": {
			{Name: "A", Role: "primary", Rationale: "r"},
			{Name: "B", Role: "supporting", Rationale: "r"},
			{Name: "C", Role: "supporting", Rationale: "r"},
			{Name: "D", Role: "supporting", Rationale: "r"},
		},
		"blank name": {{Name: "   ", Role: "primary", Rationale: "r"}},
		"bad role":   {{Name: "A", Role: "lead", Rationale: "r"}},
		"long name":  {{Name: strings.Repeat("x", 101), Role: "primary", Rationale: "r"}},
		"long rationale": {
			{Name: "A", Role: "primary", Rationale: strings.Repeat("x", 1001)},
		},
		"duplicate consumes primary": {
			{Name: "Two Pointers", Role: "supporting", Rationale: "first"},
			{Name: "two pointers", Role: "primary", Rationale: "duplicate"},
		},
	}

	for name, input := range cases {
		t.Run(name, func(t *testing.T) {
			_, err := normalizePatterns(input)
			if err == nil {
				t.Fatalf("expected error for %q", name)
			}
			if !errors.Is(err, ErrInvalidPatterns) {
				t.Errorf("expected error to wrap ErrInvalidPatterns, got %v", err)
			}
		})
	}
}

func TestDraftsFromLLM(t *testing.T) {
	drafts, err := draftsFromLLM(&llm.PatternCardResult{
		Patterns: []llm.PatternCardPattern{
			{Name: "Two Pointers", Role: "primary", Rationale: "pairs"},
			{Name: "Two Pointers", Role: "supporting", Rationale: "dup"},
			{Name: "Hash Map", Role: "supporting", Rationale: "lookup"},
		},
	})
	if err != nil {
		t.Fatalf("expected LLM drafts to normalize, got error: %v", err)
	}
	if len(drafts) != 2 {
		t.Fatalf("expected 2 drafts after dedupe, got %d", len(drafts))
	}
	if drafts[0].Role != "primary" || drafts[1].Name != "Hash Map" {
		t.Errorf("unexpected drafts: %+v", drafts)
	}
}

func TestNormalizeLLMText(t *testing.T) {
	value, err := normalizeLLMText("  hello world ", "invariant")
	if err != nil {
		t.Fatalf("expected trim to succeed, got error: %v", err)
	}
	if value != "hello world" {
		t.Errorf("expected trimmed value, got %q", value)
	}

	if _, err := normalizeLLMText("   ", "invariant"); !errors.Is(err, llm.ErrInvalidOutput) {
		t.Errorf("expected empty field to wrap ErrInvalidOutput, got %v", err)
	}

	if _, err := normalizeLLMText(strings.Repeat("x", 5001), "explanation"); !errors.Is(err, llm.ErrInvalidOutput) {
		t.Errorf("expected oversized field to wrap ErrInvalidOutput, got %v", err)
	}
}

func TestNormalizeLLMCues(t *testing.T) {
	cues, err := normalizeLLMCues([]string{"  sorted input ", "sorted input", " ", "O(1) space"})
	if err != nil {
		t.Fatalf("expected cues to normalize, got error: %v", err)
	}
	if len(cues) != 2 {
		t.Fatalf("expected 2 unique cues, got %d: %v", len(cues), cues)
	}
	if cues[0] != "sorted input" {
		t.Errorf("expected trimmed cue, got %q", cues[0])
	}

	tooMany := make([]string, maxRecognitionCues+1)
	for i := range tooMany {
		tooMany[i] = fmt.Sprintf("cue-%d", i)
	}
	if _, err := normalizeLLMCues(tooMany); !errors.Is(err, llm.ErrInvalidOutput) {
		t.Errorf("expected too many cues to wrap ErrInvalidOutput, got %v", err)
	}
}
