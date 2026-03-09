package handlers

import (
	"encoding/json"
	"net/http"

	"{{PROJECT_NAME}}/internal/repository"
)

type CounterHandler struct {
	repo *repository.CounterRepository
}

func NewCounterHandler(repo *repository.CounterRepository) *CounterHandler {
	return &CounterHandler{repo: repo}
}

func (h *CounterHandler) GetCounter(w http.ResponseWriter, r *http.Request) {
	counter, err := h.repo.Get(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to get counter"})
		return
	}
	writeJSON(w, http.StatusOK, counter)
}

func (h *CounterHandler) IncrementCounter(w http.ResponseWriter, r *http.Request) {
	counter, err := h.repo.Increment(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to increment counter"})
		return
	}
	writeJSON(w, http.StatusOK, counter)
}

func (h *CounterHandler) DecrementCounter(w http.ResponseWriter, r *http.Request) {
	counter, err := h.repo.Decrement(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to decrement counter"})
		return
	}
	writeJSON(w, http.StatusOK, counter)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
