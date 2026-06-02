package security

import (
	"strings"
	"testing"
)

func TestRandomToken(t *testing.T) {
	t.Run("returns error for non-positive byteLength", func(t *testing.T) {
		_, err := RandomToken(0)
		if err == nil {
			t.Fatal("expected error for byteLength 0")
		}
		if !strings.Contains(err.Error(), "byteLength must be positive") {
			t.Fatalf("unexpected error message: %v", err)
		}
	})

	t.Run("returns error for negative byteLength", func(t *testing.T) {
		_, err := RandomToken(-1)
		if err == nil {
			t.Fatal("expected error for byteLength -1")
		}
	})

	t.Run("returns base64url string of expected length", func(t *testing.T) {
		token, err := RandomToken(18)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		// base64 raw url encoding: ceil(18*4/3) = 24
		if len(token) != 24 {
			t.Fatalf("expected token length 24, got %d", len(token))
		}
	})

	t.Run("returns different tokens on successive calls", func(t *testing.T) {
		a, _ := RandomToken(18)
		b, _ := RandomToken(18)
		if a == b {
			t.Fatal("expected two different tokens")
		}
	})
}

func TestRandomID(t *testing.T) {
	t.Run("returns prefixed ID", func(t *testing.T) {
		id, err := RandomID("test")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !strings.HasPrefix(id, "test_") {
			t.Fatalf("expected prefix test_, got %s", id)
		}
	})

	t.Run("returns unprefixed ID when prefix is empty", func(t *testing.T) {
		id, err := RandomID("")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if strings.Contains(id, "_") {
			t.Fatalf("expected no underscore in empty-prefix ID, got %s", id)
		}
	})
}

func TestRandomPairingCode(t *testing.T) {
	t.Run("returns code in expected format", func(t *testing.T) {
		code, err := RandomPairingCode()
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(code) != 9 { // 4 chars + '-' + 4 chars
			t.Fatalf("expected length 9, got %d", len(code))
		}
		if code[4] != '-' {
			t.Fatalf("expected hyphen at position 4, got %c", code[4])
		}
	})

	t.Run("returns different codes on successive calls", func(t *testing.T) {
		a, _ := RandomPairingCode()
		b, _ := RandomPairingCode()
		if a == b {
			t.Fatal("expected two different codes")
		}
	})

	t.Run("uses only allowed charset characters", func(t *testing.T) {
		code, _ := RandomPairingCode()
		clean := strings.ReplaceAll(code, "-", "")
		for _, ch := range clean {
			if !strings.ContainsRune(pairingCodeCharset, ch) {
				t.Fatalf("character %c not in allowed charset", ch)
			}
		}
	})
}

func TestHashToken(t *testing.T) {
	t.Run("returns consistent hash for same input", func(t *testing.T) {
		h1 := HashToken("hello")
		h2 := HashToken("hello")
		if h1 != h2 {
			t.Fatalf("expected same hash for same input")
		}
	})

	t.Run("returns different hash for different input", func(t *testing.T) {
		h1 := HashToken("hello")
		h2 := HashToken("world")
		if h1 == h2 {
			t.Fatalf("expected different hashes")
		}
	})

	t.Run("returns hex string of expected length", func(t *testing.T) {
		h := HashToken("test")
		if len(h) != 64 { // sha256 -> 32 bytes -> 64 hex chars
			t.Fatalf("expected 64 hex chars, got %d", len(h))
		}
	})
}
