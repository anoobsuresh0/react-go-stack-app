package handlers

import (
	"net/http"

	"backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type CounterHandler struct {
	repo *repository.CounterRepository
}

func NewCounterHandler(repo *repository.CounterRepository) *CounterHandler {
	return &CounterHandler{repo: repo}
}

func (h *CounterHandler) Get(c *gin.Context) {
	counter, err := h.repo.Get()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get counter",
		})
		return
	}

	c.JSON(http.StatusOK, counter)
}

func (h *CounterHandler) Increment(c *gin.Context) {
	counter, err := h.repo.Increment()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to increment counter",
		})
		return
	}

	c.JSON(http.StatusOK, counter)
}

func (h *CounterHandler) Decrement(c *gin.Context) {
	counter, err := h.repo.Decrement()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to decrement counter",
		})
		return
	}

	c.JSON(http.StatusOK, counter)
}
