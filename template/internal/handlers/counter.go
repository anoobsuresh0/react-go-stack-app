package handlers

import (
	"log"
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
		log.Printf("get counter: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get counter"})
		return
	}
	c.JSON(http.StatusOK, counter)
}

func (h *CounterHandler) IncrementCounter(c *gin.Context) {
	h.adjust(c, 1)
}

func (h *CounterHandler) DecrementCounter(c *gin.Context) {
	h.adjust(c, -1)
}

func (h *CounterHandler) adjust(c *gin.Context, delta int64) {
	counter, err := h.repo.Adjust(c.Request.Context(), delta)
	if err != nil {
		log.Printf("adjust counter by %d: %v", delta, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update counter"})
		return
	}
	c.JSON(http.StatusOK, counter)
}
