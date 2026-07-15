package config

import "os"

type Config struct {
	Port        string
	Environment string
	DatabaseURL string
	CORSOrigins string
	StaticPath  string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("ENV", "development"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/{{DB_NAME}}?sslmode=disable"), // {{DOCKER_DB_ONLY}}
		DatabaseURL: getEnv("DATABASE_URL", "postgres://localhost:5432/{{DB_NAME}}?sslmode=disable"), // {{LOCAL_DB_ONLY}}
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5173"),
		StaticPath:  getEnv("STATIC_PATH", "./web/dist"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
