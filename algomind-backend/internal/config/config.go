package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                            string
	ClerkSecretKey                  string
	DatabaseURL                     string
	LLMBaseURL                      string
	LLMAPIKey                       string
	LLMModel                        string
	LLMTimeoutSecs                  int
	ExtensionTokenSecret            string
	ExtensionAccessTokenTTLSeconds  int
	ExtensionRefreshTokenTTLSeconds int
	ExtensionPairingCodeTTLSeconds  int
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables directly")
	}

	cfg := &Config{
		Port:                            getEnv("PORT", "8080"), // Default to 8080 if PORT is not set
		ClerkSecretKey:                  getEnv("CLERK_SECRET_KEY", ""),
		DatabaseURL:                     getEnv("DATABASE_URL", ""),
		LLMBaseURL:                      getLLMEnv("LLM_BASE_URL", "KIMI_BASE_URL", "https://api.moonshot.ai"),
		LLMAPIKey:                       getLLMEnv("LLM_API_KEY", "KIMI_API_KEY", ""),
		LLMModel:                        getLLMEnv("LLM_MODEL", "KIMI_MODEL", "kimi-k2.5"),
		LLMTimeoutSecs:                  getLLMEnvAsInt("LLM_TIMEOUT_SECS", "KIMI_TIMEOUT_SECS", 120),
		ExtensionTokenSecret:            getEnv("EXTENSION_TOKEN_SECRET", ""),
		ExtensionAccessTokenTTLSeconds:  getEnvAsInt("EXTENSION_ACCESS_TOKEN_TTL_SECS", 900),
		ExtensionRefreshTokenTTLSeconds: getEnvAsInt("EXTENSION_REFRESH_TOKEN_TTL_SECS", 2592000),
		ExtensionPairingCodeTTLSeconds:  getEnvAsInt("EXTENSION_PAIRING_CODE_TTL_SECS", 300),
	}

	if cfg.ClerkSecretKey == "" {
		log.Fatal("Error: CLERK_SECRET_KEY is required but not set")
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("Error: DATABASE_URL is required but not set")
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		if parsed, ok := parsePositiveInt(value); ok {
			return parsed
		}
	}
	return fallback
}

// getLLMEnv resolves an LLM setting with the canonical LLM_* name taking
// precedence over the legacy KIMI_* name. The legacy name is only consulted when
// the canonical name is unset, so a canonical value wins even when it is
// deliberately set to an empty string.
func getLLMEnv(canonical, legacy, fallback string) string {
	if value, exists := os.LookupEnv(canonical); exists {
		return value
	}
	if value, exists := os.LookupEnv(legacy); exists {
		return value
	}
	return fallback
}

// getLLMEnvAsInt is getLLMEnv for positive integers. The canonical name has
// precedence: when set (even to an empty/invalid value) it blocks the legacy
// name and this function falls back to the default, mirroring getEnvAsInt's
// treatment of invalid values.
func getLLMEnvAsInt(canonical, legacy string, fallback int) int {
	if value, exists := os.LookupEnv(canonical); exists {
		if parsed, ok := parsePositiveInt(value); ok {
			return parsed
		}
		return fallback
	}
	if value, exists := os.LookupEnv(legacy); exists {
		if parsed, ok := parsePositiveInt(value); ok {
			return parsed
		}
	}
	return fallback
}

func parsePositiveInt(value string) (int, bool) {
	var parsed int
	if _, err := fmt.Sscanf(value, "%d", &parsed); err == nil && parsed > 0 {
		return parsed, true
	}
	return 0, false
}
