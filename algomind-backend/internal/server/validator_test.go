package server

import (
	"testing"

	"github.com/go-playground/validator/v10"
)

type testStruct struct {
	Name  string `validate:"required"`
	Email string `validate:"required,email"`
	Age   int    `validate:"gte=0,lte=130"`
}

func TestNewValidator(t *testing.T) {
	v := NewValidator()
	if v == nil {
		t.Fatal("expected non-nil validator")
	}
	if v.validator == nil {
		t.Fatal("expected underlying validator to be initialized")
	}
}

func TestCustomValidatorValidate(t *testing.T) {
	v := NewValidator()

	t.Run("valid struct passes", func(t *testing.T) {
		err := v.Validate(testStruct{Name: "Alice", Email: "alice@example.com", Age: 30})
		if err != nil {
			t.Fatalf("expected no error for valid struct, got %v", err)
		}
	})

	t.Run("missing required field fails", func(t *testing.T) {
		err := v.Validate(testStruct{Email: "alice@example.com", Age: 30})
		if err == nil {
			t.Fatal("expected error for missing Name")
		}
		validationErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			t.Fatalf("expected validator.ValidationErrors, got %T", err)
		}
		if len(validationErrors) == 0 {
			t.Fatal("expected at least one validation error")
		}
	})

	t.Run("invalid email fails", func(t *testing.T) {
		err := v.Validate(testStruct{Name: "Alice", Email: "not-an-email", Age: 30})
		if err == nil {
			t.Fatal("expected error for invalid email")
		}
	})

	t.Run("age out of range fails", func(t *testing.T) {
		err := v.Validate(testStruct{Name: "Alice", Email: "alice@example.com", Age: 200})
		if err == nil {
			t.Fatal("expected error for age out of range")
		}
	})

	t.Run("nil input returns error", func(t *testing.T) {
		// validator.Struct on nil pointer returns an error
		var s *testStruct
		err := v.Validate(s)
		if err == nil {
			t.Fatal("expected error for nil pointer")
		}
	})
}
