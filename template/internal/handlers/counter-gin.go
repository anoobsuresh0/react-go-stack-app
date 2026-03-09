package handlers

import (
	"net/http"

	"{{PROJECT_NAME}}/internal/repository"

	"github.com/gin-gonic/gin"
)

type CounterHandler struct {
	repo *repository.CounterRepository
}

func NewCounterHandler(repo *repository.CounterRepository) *CounterHandler {
	return &CounterHandler{repo: repo}
}

func (h *CounterHandler) GetCounter(c *gin.Context) {
	counter, err := h.repo.Get(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get counter"})
		return
	}
	c.JSON(http.StatusOK, counter)
}

func (h *CounterHandler) IncrementCounter(c *gin.Context) {
	counter, err := h.repo.Increment(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to increment counter"})
		return
	}
	c.JSON(http.StatusOK, counter)
}

func (h *CounterHandler) DecrementCounter(c *gin.Context) {
	counter, err := h.repo.Decrement(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decrement counter"})
		return
	}
	c.JSON(http.StatusOK, counter)
}
