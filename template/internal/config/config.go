package config

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	Environment string
	CORSOrigins string
	FrontendURL string
	StaticPath  string
	GoogleClientID     string // {{AUTH_ONLY}}
	GoogleClientSecret string // {{AUTH_ONLY}}
	JWTSecret          string // {{AUTH_ONLY}}
	AllowedEmailDomain string // {{AUTH_ONLY}}
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: buildDatabaseURL(),
		Environment: getEnv("ENV", "development"),
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5173"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		StaticPath:  getEnv("STATIC_PATH", "./static"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"), // {{AUTH_ONLY}}
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"), // {{AUTH_ONLY}}
		JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production"), // {{AUTH_ONLY}}
		AllowedEmailDomain: os.Getenv("ALLOWED_EMAIL_DOMAIN"), // {{AUTH_ONLY}}
	}
}

func buildDatabaseURL() string {
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "{{DB_NAME}}")
	sslmode := getEnv("DB_SSLMODE", "disable")
	return "postgres://" + user + ":" + password + "@" + host + ":" + port + "/" + dbname + "?sslmode=" + sslmode
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
