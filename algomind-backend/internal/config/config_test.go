package config

import (
	"os"
	"testing"
)

func TestGetEnv(t *testing.T) {
	t.Run("returns value when set", func(t *testing.T) {
		t.Setenv("TEST_KEY_A", "hello")
		if got := getEnv("TEST_KEY_A", "fallback"); got != "hello" {
			t.Fatalf("expected hello, got %q", got)
		}
	})

	t.Run("returns fallback when not set", func(t *testing.T) {
		os.Unsetenv("TEST_KEY_B")
		if got := getEnv("TEST_KEY_B", "fallback"); got != "fallback" {
			t.Fatalf("expected fallback, got %q", got)
		}
	})

	t.Run("returns empty string when set to empty", func(t *testing.T) {
		t.Setenv("TEST_KEY_C", "")
		if got := getEnv("TEST_KEY_C", "fallback"); got != "" {
			t.Fatalf("expected empty string, got %q", got)
		}
	})
}

func TestGetEnvAsInt(t *testing.T) {
	t.Run("returns parsed int when valid", func(t *testing.T) {
		t.Setenv("TEST_INT_A", "42")
		if got := getEnvAsInt("TEST_INT_A", 0); got != 42 {
			t.Fatalf("expected 42, got %d", got)
		}
	})

	t.Run("returns fallback when not set", func(t *testing.T) {
		os.Unsetenv("TEST_INT_B")
		if got := getEnvAsInt("TEST_INT_B", 99); got != 99 {
			t.Fatalf("expected 99, got %d", got)
		}
	})

	t.Run("returns fallback for non-numeric value", func(t *testing.T) {
		t.Setenv("TEST_INT_C", "not-a-number")
		if got := getEnvAsInt("TEST_INT_C", 5); got != 5 {
			t.Fatalf("expected 5, got %d", got)
		}
	})

	t.Run("returns fallback for zero value", func(t *testing.T) {
		t.Setenv("TEST_INT_D", "0")
		if got := getEnvAsInt("TEST_INT_D", 10); got != 10 {
			t.Fatalf("expected 10 (zero is invalid), got %d", got)
		}
	})

	t.Run("returns fallback for negative value", func(t *testing.T) {
		t.Setenv("TEST_INT_E", "-5")
		if got := getEnvAsInt("TEST_INT_E", 10); got != 10 {
			t.Fatalf("expected 10 (negative is invalid), got %d", got)
		}
	})
}

func TestLoad(t *testing.T) {
	t.Run("loads with required env vars set", func(t *testing.T) {
		t.Setenv("CLERK_SECRET_KEY", "test-clerk-key")
		t.Setenv("DATABASE_URL", "postgres://test")

		cfg := Load()

		if cfg.Port != "8080" {
			t.Fatalf("expected default port 8080, got %q", cfg.Port)
		}
		if cfg.LLMBaseURL != "https://api.moonshot.ai" {
			t.Fatalf("expected default LLM base URL, got %q", cfg.LLMBaseURL)
		}
		if cfg.LLMModel != "kimi-k2.5" {
			t.Fatalf("expected default model, got %q", cfg.LLMModel)
		}
		if cfg.LLMTimeoutSecs != 120 {
			t.Fatalf("expected default timeout 120, got %d", cfg.LLMTimeoutSecs)
		}
		if cfg.ExtensionAccessTokenTTLSeconds != 900 {
			t.Fatalf("expected default access TTL 900, got %d", cfg.ExtensionAccessTokenTTLSeconds)
		}
	})

	t.Run("reads KIMI env vars", func(t *testing.T) {
		t.Setenv("CLERK_SECRET_KEY", "test-clerk-key")
		t.Setenv("DATABASE_URL", "postgres://test")
		t.Setenv("KIMI_BASE_URL", "https://custom.api.com")
		t.Setenv("KIMI_API_KEY", "secret-key")
		t.Setenv("KIMI_MODEL", "custom-model")
		t.Setenv("KIMI_TIMEOUT_SECS", "60")

		cfg := Load()

		if cfg.LLMBaseURL != "https://custom.api.com" {
			t.Fatalf("expected custom base URL, got %q", cfg.LLMBaseURL)
		}
		if cfg.LLMAPIKey != "secret-key" {
			t.Fatalf("expected custom API key, got %q", cfg.LLMAPIKey)
		}
		if cfg.LLMModel != "custom-model" {
			t.Fatalf("expected custom model, got %q", cfg.LLMModel)
		}
		if cfg.LLMTimeoutSecs != 60 {
			t.Fatalf("expected custom timeout 60, got %d", cfg.LLMTimeoutSecs)
		}
	})
}
