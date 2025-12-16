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
	// 1. Try to load the .env file
	// In production (like on a real server), this file might not exist 
	// because you set actual environment variables. So we don't panic here.
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables directly")
	}

	// 2. Read and populate the struct
	cfg := &Config{
		Port: getEnv("PORT", "8080"),// Default to 8080 if PORT is not set
		ClerkSecretKey: getEnv("CLERK_SECRET_KEY",""),
		DatabaseURL: getEnv("DATABASE_URL",""),
	}


	// 3. Validation
	// Crash the app if critical keys are missing
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