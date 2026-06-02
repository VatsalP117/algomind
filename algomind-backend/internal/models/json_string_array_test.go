package models

import (
	"database/sql/driver"
	"encoding/json"
	"testing"
)

func TestJSONStringArrayScan(t *testing.T) {
	t.Run("scans nil to empty slice", func(t *testing.T) {
		var a JSONStringArray
		if err := a.Scan(nil); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(a) != 0 {
			t.Fatalf("expected empty slice, got %v", a)
		}
	})

	t.Run("scans []byte", func(t *testing.T) {
		var a JSONStringArray
		if err := a.Scan([]byte(`["a","b"]`)); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(a) != 2 || a[0] != "a" || a[1] != "b" {
			t.Fatalf("unexpected value: %v", a)
		}
	})

	t.Run("scans string", func(t *testing.T) {
		var a JSONStringArray
		if err := a.Scan(`["x"]`); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(a) != 1 || a[0] != "x" {
			t.Fatalf("unexpected value: %v", a)
		}
	})

	t.Run("returns error for unsupported type", func(t *testing.T) {
		var a JSONStringArray
		err := a.Scan(123)
		if err == nil {
			t.Fatal("expected error for int input")
		}
	})

	t.Run("returns error for invalid JSON", func(t *testing.T) {
		var a JSONStringArray
		err := a.Scan([]byte(`{`))
		if err == nil {
			t.Fatal("expected error for invalid JSON")
		}
	})
}

func TestJSONStringArrayValue(t *testing.T) {
	t.Run("returns JSON bytes for non-nil slice", func(t *testing.T) {
		a := JSONStringArray{"foo", "bar"}
		v, err := a.Value()
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		b, ok := v.([]byte)
		if !ok {
			t.Fatalf("expected []byte, got %T", v)
		}
		var decoded []string
		if err := json.Unmarshal(b, &decoded); err != nil {
			t.Fatalf("unexpected unmarshal error: %v", err)
		}
		if len(decoded) != 2 || decoded[0] != "foo" || decoded[1] != "bar" {
			t.Fatalf("unexpected decoded value: %v", decoded)
		}
	})

	t.Run("returns empty JSON array for nil slice", func(t *testing.T) {
		var a JSONStringArray
		v, err := a.Value()
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		b, ok := v.([]byte)
		if !ok {
			t.Fatalf("expected []byte, got %T", v)
		}
		if string(b) != "[]" {
			t.Fatalf("expected [], got %s", string(b))
		}
	})

	t.Run("implements driver.Valuer", func(t *testing.T) {
		var _ driver.Valuer = JSONStringArray{"test"}
	})
}
