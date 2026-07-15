package config

import (
	"net/url"
	"os"
)

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
		DatabaseURL: buildDatabaseURL(),
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5173"),
		StaticPath:  getEnv("STATIC_PATH", "./web/dist"),
	}
}

// buildDatabaseURL assembles the connection string from the DB_* variables.
// A full DATABASE_URL, if set, overrides them.
func buildDatabaseURL() string {
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		return dbURL
	}

	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres") // {{DOCKER_DB_ONLY}}
	password := getEnv("DB_PASSWORD", "postgres") // {{DOCKER_DB_ONLY}}
	user := os.Getenv("DB_USER") // empty = current OS user // {{LOCAL_DB_ONLY}}
	password := os.Getenv("DB_PASSWORD") // {{LOCAL_DB_ONLY}}
	name := getEnv("DB_NAME", "{{DB_NAME}}")
	sslmode := getEnv("DB_SSLMODE", "disable")

	u := &url.URL{
		Scheme:   "postgres",
		Host:     host + ":" + port,
		Path:     "/" + name,
		RawQuery: "sslmode=" + sslmode,
	}
	if user != "" {
		if password != "" {
			u.User = url.UserPassword(user, password)
		} else {
			u.User = url.User(user)
		}
	}
	return u.String()
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
