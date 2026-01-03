package routes

import (
	"database/sql"
	"net/http"

	"backend/internal/config"
	"backend/internal/handlers"
	"backend/internal/repository"

	"github.com/gin-gonic/gin"
)

func Setup(router *gin.Engine, db *sql.DB, cfg *config.Config) {
	// Initialize repositories
	counterRepo := repository.NewCounterRepository(db)

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(db)
	counterHandler := handlers.NewCounterHandler(counterRepo)

	// API routes
	api := router.Group("/api")

	// Health check
	api.GET("/health", healthHandler.Check)

	// API info
	api.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "{{APP_TITLE}} API",
			"version": "1.0.0",
			"endpoints": gin.H{
				"health":  "GET /api/health",
				"counter": "GET /api/counter",
			},
		})
	})

	// Counter routes
	counter := api.Group("/counter")
	counter.GET("", counterHandler.Get)
	counter.POST("/increment", counterHandler.Increment)
	counter.POST("/decrement", counterHandler.Decrement)
}
