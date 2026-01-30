package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port string
	ClerkSecretKey string
	DatabaseURL string
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables directly")
	}

	cfg := &Config{
		Port: getEnv("PORT", "8080"),// Default to 8080 if PORT is not set
		ClerkSecretKey: getEnv("CLERK_SECRET_KEY",""),
		DatabaseURL: getEnv("DATABASE_URL",""),
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