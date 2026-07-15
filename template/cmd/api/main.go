package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"{{PROJECT_NAME}}/internal/config"
	"{{PROJECT_NAME}}/internal/database"
	"{{PROJECT_NAME}}/internal/handlers"
	"{{PROJECT_NAME}}/internal/middleware"
	"{{PROJECT_NAME}}/internal/repository"
	"{{PROJECT_NAME}}/migrations"

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

	if err := database.RunMigrations(context.Background(), pool, migrations.FS); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	counterRepo := repository.NewCounterRepository(pool)
	counterHandler := handlers.NewCounterHandler(counterRepo)
	healthHandler := handlers.NewHealthHandler(pool)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", healthHandler.HealthCheck)
	mux.HandleFunc("GET /api/counter", counterHandler.GetCounter)
	mux.HandleFunc("POST /api/counter/increment", counterHandler.IncrementCounter)
	mux.HandleFunc("POST /api/counter/decrement", counterHandler.DecrementCounter)

	registerStatic(mux, cfg.StaticPath)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           middleware.CORSMiddleware(cfg.CORSOrigins)(mux),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("Server listening on http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()

	log.Println("Shutting down...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Graceful shutdown failed: %v", err)
	}
}

// registerStatic serves the built frontend (web/dist) with an SPA fallback.
// In development the frontend runs separately via `npm run dev`, so this is a
// no-op until `make build` has produced the static assets.
func registerStatic(mux *http.ServeMux, staticPath string) {
	if _, err := os.Stat(staticPath); err != nil {
		return
	}

	fileServer := http.FileServer(http.Dir(staticPath))
	index := filepath.Join(staticPath, "index.html")

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		cleaned := filepath.Clean(strings.TrimPrefix(r.URL.Path, "/"))
		if cleaned != "." && !strings.HasPrefix(cleaned, "..") {
			if info, err := os.Stat(filepath.Join(staticPath, cleaned)); err == nil && !info.IsDir() {
				fileServer.ServeHTTP(w, r)
				return
			}
		}
		http.ServeFile(w, r, index)
	})
}
