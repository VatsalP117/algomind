package config

import (
	"os"
	"testing"
)

// unsetenv removes an environment variable for the duration of a test, restoring
// its previous value (if any) on cleanup.
func unsetenv(t *testing.T, key string) {
	t.Helper()
	t.Setenv(key, "") // registers cleanup restoring the original value
	os.Unsetenv(key)
}

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
		unsetenv(t, "TEST_INT_B")
		if got := getEnvAsInt("TEST_INT_B", 99); got != 99 {
			t.Fatalf("expected 99, got %d", got)
		}
	})

	t.Run("returns fallback for invalid values", func(t *testing.T) {
		for _, value := range []string{"not-a-number", "0", "-5"} {
			t.Run(value, func(t *testing.T) {
				t.Setenv("TEST_INT_INVALID", value)
				if got := getEnvAsInt("TEST_INT_INVALID", 10); got != 10 {
					t.Fatalf("expected fallback 10 for %q, got %d", value, got)
				}
			})
		}
	})
}

func TestGetLLMEnv(t *testing.T) {
	t.Run("canonical wins when both set", func(t *testing.T) {
		t.Setenv("LLM_BASE_URL", "https://canonical.example")
		t.Setenv("KIMI_BASE_URL", "https://legacy.example")
		if got := getLLMEnv("LLM_BASE_URL", "KIMI_BASE_URL", "https://default.example"); got != "https://canonical.example" {
			t.Fatalf("expected canonical value, got %q", got)
		}
	})

	t.Run("canonical empty string wins over legacy", func(t *testing.T) {
		t.Setenv("LLM_API_KEY", "")
		t.Setenv("KIMI_API_KEY", "secret-key")
		if got := getLLMEnv("LLM_API_KEY", "KIMI_API_KEY", "fallback"); got != "" {
			t.Fatalf("expected empty canonical value to win, got %q", got)
		}
	})

	t.Run("falls back to legacy when canonical unset", func(t *testing.T) {
		unsetenv(t, "LLM_MODEL")
		t.Setenv("KIMI_MODEL", "legacy-model")
		if got := getLLMEnv("LLM_MODEL", "KIMI_MODEL", "default-model"); got != "legacy-model" {
			t.Fatalf("expected legacy value, got %q", got)
		}
	})

	t.Run("uses default when neither set", func(t *testing.T) {
		unsetenv(t, "LLM_BASE_URL")
		unsetenv(t, "KIMI_BASE_URL")
		if got := getLLMEnv("LLM_BASE_URL", "KIMI_BASE_URL", "https://default.example"); got != "https://default.example" {
			t.Fatalf("expected default, got %q", got)
		}
	})
}

func TestGetLLMEnvAsInt(t *testing.T) {
	t.Run("canonical wins when both set", func(t *testing.T) {
		t.Setenv("LLM_TIMEOUT_SECS", "30")
		t.Setenv("KIMI_TIMEOUT_SECS", "60")
		if got := getLLMEnvAsInt("LLM_TIMEOUT_SECS", "KIMI_TIMEOUT_SECS", 120); got != 30 {
			t.Fatalf("expected canonical 30, got %d", got)
		}
	})

	t.Run("falls back to legacy when canonical unset", func(t *testing.T) {
		unsetenv(t, "LLM_TIMEOUT_SECS")
		t.Setenv("KIMI_TIMEOUT_SECS", "60")
		if got := getLLMEnvAsInt("LLM_TIMEOUT_SECS", "KIMI_TIMEOUT_SECS", 120); got != 60 {
			t.Fatalf("expected legacy 60, got %d", got)
		}
	})

	t.Run("empty canonical blocks legacy and uses default", func(t *testing.T) {
		t.Setenv("LLM_TIMEOUT_SECS", "")
		t.Setenv("KIMI_TIMEOUT_SECS", "60")
		if got := getLLMEnvAsInt("LLM_TIMEOUT_SECS", "KIMI_TIMEOUT_SECS", 120); got != 120 {
			t.Fatalf("expected default 120 (empty canonical blocks legacy), got %d", got)
		}
	})

	t.Run("invalid canonical blocks legacy and uses default", func(t *testing.T) {
		t.Setenv("LLM_TIMEOUT_SECS", "not-a-number")
		t.Setenv("KIMI_TIMEOUT_SECS", "60")
		if got := getLLMEnvAsInt("LLM_TIMEOUT_SECS", "KIMI_TIMEOUT_SECS", 120); got != 120 {
			t.Fatalf("expected default 120 (invalid canonical blocks legacy), got %d", got)
		}
	})

	t.Run("uses default when neither set", func(t *testing.T) {
		unsetenv(t, "LLM_TIMEOUT_SECS")
		unsetenv(t, "KIMI_TIMEOUT_SECS")
		if got := getLLMEnvAsInt("LLM_TIMEOUT_SECS", "KIMI_TIMEOUT_SECS", 120); got != 120 {
			t.Fatalf("expected default 120, got %d", got)
		}
	})
}

func TestLoad(t *testing.T) {
	requiredEnv := func(t *testing.T) {
		t.Helper()
		for _, key := range []string{
			"LLM_BASE_URL", "LLM_API_KEY", "LLM_MODEL", "LLM_TIMEOUT_SECS",
			"KIMI_BASE_URL", "KIMI_API_KEY", "KIMI_MODEL", "KIMI_TIMEOUT_SECS",
		} {
			unsetenv(t, key)
		}
		t.Setenv("CLERK_SECRET_KEY", "test-clerk-key")
		t.Setenv("DATABASE_URL", "postgres://test")
	}

	t.Run("loads with required env vars set", func(t *testing.T) {
		requiredEnv(t)

		cfg := Load()

		if cfg.Port != "8080" {
			t.Fatalf("expected default port 8080, got %q", cfg.Port)
		}
		if cfg.LLMBaseURL != "https://api.moonshot.ai" {
			t.Fatalf("expected default LLM base URL, got %q", cfg.LLMBaseURL)
		}
		if cfg.LLMAPIKey != "" {
			t.Fatalf("expected empty default LLM API key, got %q", cfg.LLMAPIKey)
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

	t.Run("reads LLM env vars", func(t *testing.T) {
		requiredEnv(t)
		t.Setenv("LLM_BASE_URL", "https://custom.api.com")
		t.Setenv("LLM_API_KEY", "secret-key")
		t.Setenv("LLM_MODEL", "custom-model")
		t.Setenv("LLM_TIMEOUT_SECS", "60")

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

	t.Run("LLM env vars take precedence over KIMI env vars", func(t *testing.T) {
		requiredEnv(t)
		t.Setenv("LLM_BASE_URL", "https://canonical.api.com")
		t.Setenv("LLM_API_KEY", "canonical-key")
		t.Setenv("LLM_MODEL", "canonical-model")
		t.Setenv("LLM_TIMEOUT_SECS", "45")
		t.Setenv("KIMI_BASE_URL", "https://legacy.api.com")
		t.Setenv("KIMI_API_KEY", "legacy-key")
		t.Setenv("KIMI_MODEL", "legacy-model")
		t.Setenv("KIMI_TIMEOUT_SECS", "60")

		cfg := Load()

		if cfg.LLMBaseURL != "https://canonical.api.com" {
			t.Fatalf("expected canonical base URL, got %q", cfg.LLMBaseURL)
		}
		if cfg.LLMAPIKey != "canonical-key" {
			t.Fatalf("expected canonical API key, got %q", cfg.LLMAPIKey)
		}
		if cfg.LLMModel != "canonical-model" {
			t.Fatalf("expected canonical model, got %q", cfg.LLMModel)
		}
		if cfg.LLMTimeoutSecs != 45 {
			t.Fatalf("expected canonical timeout 45, got %d", cfg.LLMTimeoutSecs)
		}
	})

	t.Run("empty canonical LLM values win over KIMI values", func(t *testing.T) {
		requiredEnv(t)
		t.Setenv("LLM_BASE_URL", "")
		t.Setenv("LLM_API_KEY", "")
		t.Setenv("LLM_MODEL", "")
		t.Setenv("LLM_TIMEOUT_SECS", "")
		t.Setenv("KIMI_BASE_URL", "https://legacy.api.com")
		t.Setenv("KIMI_API_KEY", "legacy-key")
		t.Setenv("KIMI_MODEL", "legacy-model")
		t.Setenv("KIMI_TIMEOUT_SECS", "60")

		cfg := Load()

		if cfg.LLMBaseURL != "" {
			t.Fatalf("expected empty canonical base URL to win, got %q", cfg.LLMBaseURL)
		}
		if cfg.LLMAPIKey != "" {
			t.Fatalf("expected empty canonical API key to win, got %q", cfg.LLMAPIKey)
		}
		if cfg.LLMModel != "" {
			t.Fatalf("expected empty canonical model to win, got %q", cfg.LLMModel)
		}
		if cfg.LLMTimeoutSecs != 120 {
			t.Fatalf("expected default timeout 120 (empty canonical blocks legacy), got %d", cfg.LLMTimeoutSecs)
		}
	})

	t.Run("falls back to KIMI env vars when LLM vars unset", func(t *testing.T) {
		requiredEnv(t)
		unsetenv(t, "LLM_BASE_URL")
		unsetenv(t, "LLM_API_KEY")
		unsetenv(t, "LLM_MODEL")
		unsetenv(t, "LLM_TIMEOUT_SECS")
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
