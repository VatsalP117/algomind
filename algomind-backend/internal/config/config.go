package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	ClerkSecretKey string
	DatabaseURL    string
	LLMBaseURL     string
	LLMAPIKey      string
	LLMModel       string
	LLMTimeoutSecs int
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables directly")
	}

	cfg := &Config{
		Port:           getEnv("PORT", "8080"), // Default to 8080 if PORT is not set
		ClerkSecretKey: getEnv("CLERK_SECRET_KEY", ""),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		LLMBaseURL:     getEnvWithFallback("KIMI_BASE_URL", "LLM_BASE_URL", "https://api.moonshot.ai"),
		LLMAPIKey:      getEnvWithFallback("KIMI_API_KEY", "LLM_API_KEY", ""),
		LLMModel:       getEnvWithFallback("KIMI_MODEL", "LLM_MODEL", "kimi-k2.5"),
		LLMTimeoutSecs: getEnvAsIntWithFallback("KIMI_TIMEOUT_SECS", "LLM_TIMEOUT_SECS", 120),
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

func getEnvWithFallback(primaryKey, secondaryKey, fallback string) string {
	if value, exists := os.LookupEnv(primaryKey); exists {
		return value
	}
	return getEnv(secondaryKey, fallback)
}

func getEnvAsInt(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		var parsed int
		if _, err := fmt.Sscanf(value, "%d", &parsed); err == nil && parsed > 0 {
			return parsed
		}
	}
	return fallback
}

func getEnvAsIntWithFallback(primaryKey, secondaryKey string, fallback int) int {
	if value, exists := os.LookupEnv(primaryKey); exists {
		var parsed int
		if _, err := fmt.Sscanf(value, "%d", &parsed); err == nil && parsed > 0 {
			return parsed
		}
	}
	return getEnvAsInt(secondaryKey, fallback)
}
