package leetcode

import (
	"testing"
)

func TestNormalizeProblemURL(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantURL  string
		wantSlug string
		wantErr  bool
	}{
		{
			name:     "standard problem URL",
			input:    "https://leetcode.com/problems/two-sum/",
			wantURL:  "https://leetcode.com/problems/two-sum/",
			wantSlug: "two-sum",
			wantErr:  false,
		},
		{
			name:     "URL without trailing slash",
			input:    "https://leetcode.com/problems/two-sum",
			wantURL:  "https://leetcode.com/problems/two-sum/",
			wantSlug: "two-sum",
			wantErr:  false,
		},
		{
			name:     "URL with extra whitespace",
			input:    "  https://leetcode.com/problems/two-sum/  ",
			wantURL:  "https://leetcode.com/problems/two-sum/",
			wantSlug: "two-sum",
			wantErr:  false,
		},
		{
			name:     "uppercase slug gets lowercased",
			input:    "https://leetcode.com/problems/Two-Sum/",
			wantURL:  "https://leetcode.com/problems/two-sum/",
			wantSlug: "two-sum",
			wantErr:  false,
		},
		{
			name:    "non-leetcode domain",
			input:   "https://example.com/problems/two-sum/",
			wantErr: true,
		},
		{
			name:    "missing problems path",
			input:   "https://leetcode.com/two-sum/",
			wantErr: true,
		},
		{
			name:    "completely invalid URL",
			input:   "://not-a-url",
			wantErr: true,
		},
		{
			name:    "empty string",
			input:   "",
			wantErr: true,
		},
		{
			name:     "slug with numbers and hyphens",
			input:    "https://leetcode.com/problems/4sum-ii/",
			wantURL:  "https://leetcode.com/problems/4sum-ii/",
			wantSlug: "4sum-ii",
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url, slug, err := NormalizeProblemURL(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error for input %q, got none", tt.input)
				}
				if err != ErrInvalidProblemURL {
					t.Fatalf("expected ErrInvalidProblemURL, got %v", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if url != tt.wantURL {
				t.Fatalf("expected URL %q, got %q", tt.wantURL, url)
			}
			if slug != tt.wantSlug {
				t.Fatalf("expected slug %q, got %q", tt.wantSlug, slug)
			}
		})
	}
}
