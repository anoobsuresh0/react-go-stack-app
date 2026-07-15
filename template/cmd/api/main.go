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
	"{{PROJECT_NAME}}/internal/repository"
	"{{PROJECT_NAME}}/migrations"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
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

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(cfg.CORSOrigins, ","),
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	counterRepo := repository.NewCounterRepository(pool)
	counterHandler := handlers.NewCounterHandler(counterRepo)
	healthHandler := handlers.NewHealthHandler(pool)

	api := router.Group("/api")
	{
		api.GET("/health", healthHandler.HealthCheck)
		api.GET("/counter", counterHandler.GetCounter)
		api.POST("/counter/increment", counterHandler.IncrementCounter)
		api.POST("/counter/decrement", counterHandler.DecrementCounter)
	}

	registerStatic(router, cfg.StaticPath)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
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
// In development the frontend runs separately via `npm run dev`, so this only
// kicks in after `make build` has produced the static assets.
func registerStatic(router *gin.Engine, staticPath string) {
	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
			return
		}
		if _, err := os.Stat(staticPath); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
			return
		}
		cleaned := filepath.Clean(strings.TrimPrefix(c.Request.URL.Path, "/"))
		if cleaned != "." && !strings.HasPrefix(cleaned, "..") {
			file := filepath.Join(staticPath, cleaned)
			if info, err := os.Stat(file); err == nil && !info.IsDir() {
				c.File(file)
				return
			}
		}
		c.File(filepath.Join(staticPath, "index.html"))
	})
}
