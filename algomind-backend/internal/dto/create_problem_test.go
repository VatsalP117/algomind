package dto

import (
	"testing"

	"github.com/go-playground/validator/v10"
)

func TestCreateProblemRequestValidation(t *testing.T) {
	validate := validator.New()

	t.Run("valid request passes", func(t *testing.T) {
		req := CreateProblemRequest{
			ConceptID:  1,
			Title:      "Two Sum",
			Difficulty: "MEDIUM",
			Summary:    "Find two numbers that add up to target",
			Answer:     "Use a hash map",
		}
		if err := validate.Struct(req); err != nil {
			t.Fatalf("expected valid request, got error: %v", err)
		}
	})

	t.Run("missing concept_id fails", func(t *testing.T) {
		req := CreateProblemRequest{
			Title:      "Two Sum",
			Difficulty: "MEDIUM",
			Summary:    "Find two numbers",
			Answer:     "hash map",
		}
		if err := validate.Struct(req); err == nil {
			t.Fatal("expected error for missing concept_id")
		}
	})

	t.Run("missing title fails", func(t *testing.T) {
		req := CreateProblemRequest{
			ConceptID:  1,
			Difficulty: "MEDIUM",
			Summary:    "Find two numbers",
			Answer:     "hash map",
		}
		if err := validate.Struct(req); err == nil {
			t.Fatal("expected error for missing title")
		}
	})

	t.Run("missing summary fails", func(t *testing.T) {
		req := CreateProblemRequest{
			ConceptID:  1,
			Title:      "Two Sum",
			Difficulty: "MEDIUM",
			Answer:     "hash map",
		}
		if err := validate.Struct(req); err == nil {
			t.Fatal("expected error for missing summary")
		}
	})

	t.Run("missing answer fails", func(t *testing.T) {
		req := CreateProblemRequest{
			ConceptID:  1,
			Title:      "Two Sum",
			Difficulty: "MEDIUM",
			Summary:    "Find two numbers",
		}
		if err := validate.Struct(req); err == nil {
			t.Fatal("expected error for missing answer")
		}
	})

	t.Run("invalid difficulty fails", func(t *testing.T) {
		req := CreateProblemRequest{
			ConceptID:  1,
			Title:      "Two Sum",
			Difficulty: "IMPOSSIBLE",
			Summary:    "Find two numbers",
			Answer:     "hash map",
		}
		if err := validate.Struct(req); err == nil {
			t.Fatal("expected error for invalid difficulty")
		}
	})

	t.Run("all valid difficulties pass", func(t *testing.T) {
		for _, d := range []string{"EASY", "MEDIUM", "HARD"} {
			req := CreateProblemRequest{
				ConceptID:  1,
				Title:      "Two Sum",
				Difficulty: d,
				Summary:    "Find two numbers",
				Answer:     "hash map",
			}
			if err := validate.Struct(req); err != nil {
				t.Fatalf("expected %q to be valid, got error: %v", d, err)
			}
		}
	})

	t.Run("optional fields omitted still valid", func(t *testing.T) {
		req := CreateProblemRequest{
			ConceptID:  1,
			Title:      "Two Sum",
			Difficulty: "EASY",
			Summary:    "Find two numbers",
			Answer:     "hash map",
		}
		if err := validate.Struct(req); err != nil {
			t.Fatalf("expected valid with optional fields omitted, got error: %v", err)
		}
	})
}
