package handlers

import (
	"encoding/json"
	"log"
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
		log.Printf("get counter: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to get counter")
		return
	}
	writeJSON(w, http.StatusOK, counter)
}

func (h *CounterHandler) IncrementCounter(w http.ResponseWriter, r *http.Request) {
	h.adjust(w, r, 1)
}

func (h *CounterHandler) DecrementCounter(w http.ResponseWriter, r *http.Request) {
	h.adjust(w, r, -1)
}

func (h *CounterHandler) adjust(w http.ResponseWriter, r *http.Request, delta int64) {
	counter, err := h.repo.Adjust(r.Context(), delta)
	if err != nil {
		log.Printf("adjust counter by %d: %v", delta, err)
		writeError(w, http.StatusInternalServerError, "Failed to update counter")
		return
	}
	writeJSON(w, http.StatusOK, counter)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("encode response: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
