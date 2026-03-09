package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"{{PROJECT_NAME}}/internal/config"
	"{{PROJECT_NAME}}/internal/database"
	"{{PROJECT_NAME}}/internal/handlers"
	"{{PROJECT_NAME}}/internal/middleware"
	"{{PROJECT_NAME}}/internal/repository"

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

	if err := database.RunMigrations(context.Background(), pool, "migrations"); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	counterRepo := repository.NewCounterRepository(pool)
	counterHandler := handlers.NewCounterHandler(counterRepo)
	healthHandler := handlers.NewHealthHandler(pool)

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	r.Use(middleware.CORSMiddleware(cfg.CORSOrigins))

	// API routes
	api := r.Group("/api")
	{
		api.GET("/health", healthHandler.HealthCheck)
		api.GET("/counter", counterHandler.GetCounter)
		api.POST("/counter/increment", counterHandler.IncrementCounter)
		api.POST("/counter/decrement", counterHandler.DecrementCounter)
	}

	// {{AUTH_BLOCK_START}}
	authRepo := repository.NewAuthRepository(pool)
	authHandler := handlers.NewAuthHandler(authRepo, cfg)
	authMw := middleware.NewAuthMiddleware(authRepo, cfg.JWTSecret)

	auth := r.Group("/api/auth")
	{
		auth.GET("/google", authHandler.GoogleLogin)
		auth.GET("/callback", authHandler.GoogleCallback)
		auth.GET("/me", authMw.RequireAuth(), authHandler.GetCurrentUser)
		auth.POST("/logout", authMw.RequireAuth(), authHandler.Logout)
	}
	// {{AUTH_BLOCK_END}}

	// Serve static frontend
	staticPath := cfg.StaticPath
	if _, err := os.Stat(staticPath); err == nil {
		r.Static("/assets", filepath.Join(staticPath, "assets"))
		r.StaticFile("/favicon.ico", filepath.Join(staticPath, "favicon.ico"))
		r.NoRoute(func(c *gin.Context) {
			c.File(filepath.Join(staticPath, "index.html"))
		})
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
