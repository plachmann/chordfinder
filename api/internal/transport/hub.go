package transport

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSEvent struct {
	Type       string   `json:"type"`
	Label      string   `json:"label,omitempty"`
	Section    string   `json:"section,omitempty"`
	Chords     []string `json:"chords,omitempty"`
	Confidence string   `json:"confidence,omitempty"`
	State      string   `json:"state,omitempty"`
}

type wsClient struct {
	conn *websocket.Conn
	send chan WSEvent
}

var (
	clientsMu sync.RWMutex
	wsClients = map[string]*wsClient{}
)

func (h *Handler) RegisterSession(id string) {
	h.mu.Lock()
	if _, ok := h.sessions[id]; !ok {
		h.sessions[id] = &Session{ID: id}
	}
	h.mu.Unlock()
}

func (h *Handler) ServeStream(w http.ResponseWriter, r *http.Request, sessionID string) {
	h.mu.RLock()
	_, ok := h.sessions[sessionID]
	h.mu.RUnlock()
	if !ok {
		http.Error(w, "session not found", http.StatusNotFound)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("upgrade error: %v", err)
		return
	}

	c := &wsClient{conn: conn, send: make(chan WSEvent, 32)}
	clientsMu.Lock()
	wsClients[sessionID] = c
	clientsMu.Unlock()

	// Send initial status
	c.send <- WSEvent{Type: "status", State: "listening"}

	// Writer goroutine
	go func() {
		defer conn.Close()
		for evt := range c.send {
			data, _ := json.Marshal(evt)
			if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
				log.Printf("write error: %v", err)
				return
			}
		}
	}()

	// Reader goroutine — receives binary PCM audio
	go func() {
		defer func() {
			clientsMu.Lock()
			delete(wsClients, sessionID)
			clientsMu.Unlock()
			close(c.send)
		}()
		for {
			msgType, data, err := conn.ReadMessage()
			if err != nil {
				return
			}
			if msgType == websocket.BinaryMessage {
				// Audio data — worker integration wired in Task 6
				_ = data
			}
		}
	}()
}

// BroadcastEvent sends an event to the client for a given session.
func BroadcastEvent(sessionID string, evt WSEvent) {
	clientsMu.RLock()
	c, ok := wsClients[sessionID]
	clientsMu.RUnlock()
	if ok {
		select {
		case c.send <- evt:
		default:
		}
	}
}
