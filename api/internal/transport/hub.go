package transport

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
	"sync"

	"github.com/chordfinder/api/internal/chords"
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

	// Reader goroutine — receives binary PCM audio, runs chord detection inline
	go func() {
		defer func() {
			clientsMu.Lock()
			delete(wsClients, sessionID)
			clientsMu.Unlock()
			close(c.send)
		}()
		detector := chords.NewSectionDetector()
		var pcmBuf []float32
		const chunkSamples = 4000 // 250ms at 16kHz

		for {
			msgType, data, err := conn.ReadMessage()
			if err != nil {
				return
			}
			if msgType != websocket.BinaryMessage {
				continue
			}
			// data is raw 16-bit PCM, little-endian, mono, 16kHz
			for i := 0; i+1 < len(data); i += 2 {
				sample := int16(data[i]) | int16(data[i+1])<<8
				pcmBuf = append(pcmBuf, float32(sample)/math.MaxInt16)
			}
			for len(pcmBuf) >= chunkSamples {
				chunk := pcmBuf[:chunkSamples]
				pcmBuf = pcmBuf[chunkSamples:]
				result := chords.DetectChord(chunk, 16000)
				detector.AddChord(result.Name, result.Confidence)
				sections := detector.GetSections()
				if len(sections) > 0 {
					latest := sections[len(sections)-1]
					c.send <- WSEvent{
						Type:       "chord_update",
						Section:    latest.Label,
						Chords:     latest.Chords,
						Confidence: result.Confidence,
					}
				}
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
