package transport

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/google/uuid"
)

type Handler struct {
	mu       sync.RWMutex
	sessions map[string]*Session
	baseURL  string
}

type Session struct {
	ID string
}

func NewHandler() *Handler {
	return &Handler{
		sessions: make(map[string]*Session),
		baseURL:  "ws://localhost:8080",
	}
}

func (h *Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	id := uuid.New().String()
	h.mu.Lock()
	h.sessions[id] = &Session{ID: id}
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"session_id":    id,
		"websocket_url": fmt.Sprintf("%s/sessions/%s/stream", h.baseURL, id),
	})
}

func (h *Handler) DeleteSession(w http.ResponseWriter, r *http.Request, sessionID string) {
	h.mu.Lock()
	_, exists := h.sessions[sessionID]
	if exists {
		delete(h.sessions, sessionID)
	}
	h.mu.Unlock()

	if !exists {
		http.Error(w, "session not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
