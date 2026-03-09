package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"{{PROJECT_NAME}}/internal/config"
	"{{PROJECT_NAME}}/internal/database"
	"{{PROJECT_NAME}}/internal/handlers"
	"{{PROJECT_NAME}}/internal/middleware"
	"{{PROJECT_NAME}}/internal/repository"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	pool, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	if err := database.RunMigrations(context.Background(), pool, "migrations"); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	counterRepo := repository.NewCounterRepository(pool)
	counterHandler := handlers.NewCounterHandler(counterRepo)
	healthHandler := handlers.NewHealthHandler(pool)

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("GET /api/health", healthHandler.HealthCheck)
	mux.HandleFunc("GET /api/counter", counterHandler.GetCounter)
	mux.HandleFunc("POST /api/counter/increment", counterHandler.IncrementCounter)
	mux.HandleFunc("POST /api/counter/decrement", counterHandler.DecrementCounter)

	// {{AUTH_BLOCK_START}}
	authRepo := repository.NewAuthRepository(pool)
	authHandler := handlers.NewAuthHandler(authRepo, cfg)
	authMw := middleware.NewAuthMiddleware(authRepo, cfg.JWTSecret)

	mux.HandleFunc("GET /api/auth/google", authHandler.GoogleLogin)
	mux.HandleFunc("GET /api/auth/callback", authHandler.GoogleCallback)
	mux.Handle("GET /api/auth/me", authMw.RequireAuth(http.HandlerFunc(authHandler.GetCurrentUser)))
	mux.Handle("POST /api/auth/logout", authMw.RequireAuth(http.HandlerFunc(authHandler.Logout)))
	// {{AUTH_BLOCK_END}}

	// Serve static frontend
	staticPath := cfg.StaticPath
	if _, statErr := os.Stat(staticPath); statErr == nil {
		assetsDir := filepath.Join(staticPath, "assets")
		mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(assetsDir))))
		mux.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, filepath.Join(staticPath, "favicon.ico"))
		})
		// SPA fallback - serve index.html for all non-API, non-asset routes
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// If it's an API route that wasn't matched, return 404
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}
			http.ServeFile(w, r, filepath.Join(staticPath, "index.html"))
		})
	}

	handler := middleware.CORSMiddleware(cfg.CORSOrigins)(mux)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
