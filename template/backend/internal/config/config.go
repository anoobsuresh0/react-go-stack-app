package config

import (
	"os"
)

type Config struct {
	// Database
	DatabaseURL string

	// Server
	CORSOrigins string
	Port        string

	// Environment
	Environment string

	// Frontend
	FrontendURL string
}

func Load() *Config {
	env := getEnv("ENV", "development")

	return &Config{
		// Database
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/{{DB_NAME}}?sslmode=disable"),

		// Server
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5173"),
		Port:        getEnv("PORT", "8080"),

		// Environment
		Environment: env,

		// Frontend
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
