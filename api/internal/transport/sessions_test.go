package transport_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/chordfinder/api/internal/transport"
)

func TestCreateSession(t *testing.T) {
	h := transport.NewHandler()
	req := httptest.NewRequest(http.MethodPost, "/sessions", nil)
	w := httptest.NewRecorder()

	h.CreateSession(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", w.Code)
	}
	var body map[string]string
	json.NewDecoder(w.Body).Decode(&body)
	if body["session_id"] == "" {
		t.Error("expected session_id in response")
	}
	if body["websocket_url"] == "" {
		t.Error("expected websocket_url in response")
	}
}

func TestDeleteSession(t *testing.T) {
	h := transport.NewHandler()
	req := httptest.NewRequest(http.MethodPost, "/sessions", nil)
	w := httptest.NewRecorder()
	h.CreateSession(w, req)
	var body map[string]string
	json.NewDecoder(w.Body).Decode(&body)
	sessionID := body["session_id"]

	req2 := httptest.NewRequest(http.MethodDelete, "/sessions/"+sessionID, nil)
	w2 := httptest.NewRecorder()
	h.DeleteSession(w2, req2, sessionID)
	if w2.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", w2.Code)
	}
}

func TestDeleteSessionNotFound(t *testing.T) {
	h := transport.NewHandler()
	req := httptest.NewRequest(http.MethodDelete, "/sessions/nonexistent", nil)
	w := httptest.NewRecorder()
	h.DeleteSession(w, req, "nonexistent")
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}
