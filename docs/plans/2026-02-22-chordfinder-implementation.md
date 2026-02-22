# ChordFinder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a cross-platform mobile app (iOS + Android) that listens to music and returns real-time chord progressions broken down by song section, with instrument-specific chord diagrams.

**Architecture:** React Native app streams microphone audio over WebSocket to a Go API server. The Go server performs chord detection in-process (FFT via `mjibson/go-dsp`, chroma template matching, section segmentation), then pushes chord/section events back to the app. No external worker process. Chord voicing diagrams (guitar, banjo, mandolin, piano) are rendered as SVGs in the app from structured data returned by the API.

**Tech Stack:** React Native (iOS/Android), Go 1.22+ (API, gorilla/websocket, chi router, go-dsp for FFT), JSON file-based chord voicing DB (v1), OpenAPI 3.1 spec as API contract.

---

## Task 1: Monorepo Scaffolding

**Files:**
- Create: `api/` — Go module
- Create: `worker/` — Python service
- Create: `app/` — React Native project
- Create: `docs/` — already exists

### Step 1: Initialize repo and top-level structure

```bash
cd /Users/phillachmann/src/chordfinder
git init
echo "node_modules/\n.expo/\nbuild/\ndist/\n__pycache__/\n*.pyc\n.venv/\nbin/\n" > .gitignore
mkdir -p api/internal/{audio,chords,sections,transport} api/openapi
mkdir -p worker/tests
```

### Step 2: Initialize Go module

```bash
cd api
go mod init github.com/chordfinder/api
go get github.com/go-chi/chi/v5
go get github.com/gorilla/websocket
go get github.com/google/uuid
```

### Step 3: Create minimal Go main.go that compiles

```go
// api/main.go
package main

import (
    "log"
    "net/http"
    "github.com/go-chi/chi/v5"
)

func main() {
    r := chi.NewRouter()
    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })
    log.Println("ChordFinder API listening on :8080")
    log.Fatal(http.ListenAndServe(":8080", r))
}
```

### Step 4: Verify it compiles and runs

```bash
cd api && go run main.go &
curl http://localhost:8080/health
# Expected: ok
kill %1
```

### Step 5: Initialize Python worker

```bash
cd /Users/phillachmann/src/chordfinder/worker
python3 -m venv .venv
source .venv/bin/activate
pip install librosa numpy scipy pytest
pip freeze > requirements.txt
```

### Step 6: Create minimal worker entry point

```python
# worker/main.py
import sys
import json

def main():
    print(json.dumps({"status": "ready"}), flush=True)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        # placeholder — will be implemented in Task 3
        print(json.dumps({"type": "status", "state": "processing"}), flush=True)

if __name__ == "__main__":
    main()
```

### Step 7: Initialize React Native app

```bash
cd /Users/phillachmann/src/chordfinder
npx create-expo-app app --template blank-typescript
cd app
npx expo install react-native-svg
npx expo install @react-native-async-storage/async-storage
npx expo install expo-av  # microphone access
```

### Step 8: Commit scaffold

```bash
cd /Users/phillachmann/src/chordfinder
git add .
git commit -m "chore: initialize monorepo scaffold (api, worker, app)"
```

---

## Task 2: OpenAPI Spec

**Files:**
- Create: `api/openapi/spec.yaml`

### Step 1: Write the OAS 3.1 spec

```yaml
# api/openapi/spec.yaml
openapi: "3.1.0"
info:
  title: ChordFinder API
  version: "1.0.0"
  description: Real-time chord detection API

paths:
  /health:
    get:
      summary: Health check
      responses:
        "200":
          description: OK
          content:
            text/plain:
              schema:
                type: string

  /sessions:
    post:
      summary: Create a new listening session
      responses:
        "201":
          description: Session created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SessionCreated"

  /sessions/{sessionId}:
    delete:
      summary: End a listening session
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        "204":
          description: Session ended
        "404":
          description: Session not found

  /sessions/{sessionId}/stream:
    get:
      summary: WebSocket endpoint for audio streaming and chord events
      description: |
        Upgrade to WebSocket. Client sends binary PCM audio frames (16kHz, mono, 16-bit).
        Server sends JSON events.
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        "101":
          description: Switching Protocols (WebSocket)

  /chords/{chordName}:
    get:
      summary: Get voicing data for a chord
      parameters:
        - name: chordName
          in: path
          required: true
          schema:
            type: string
          example: Am
      responses:
        "200":
          description: Chord voicing data
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ChordVoicing"
        "404":
          description: Chord not found

components:
  schemas:
    SessionCreated:
      type: object
      required: [session_id, websocket_url]
      properties:
        session_id:
          type: string
          format: uuid
        websocket_url:
          type: string
          example: "ws://localhost:8080/sessions/abc-123/stream"

    WebSocketEvent:
      type: object
      required: [type]
      properties:
        type:
          type: string
          enum: [section, chord_update, status]
        label:
          type: string
          description: Section label (for type=section)
        section:
          type: string
          description: Section label (for type=chord_update)
        chords:
          type: array
          items:
            type: string
        confidence:
          type: string
          enum: [high, medium, low]
        state:
          type: string
          enum: [listening, processing, complete, no_signal, error]

    ChordVoicing:
      type: object
      required: [name, display_name, instruments]
      properties:
        name:
          type: string
          example: Am
        display_name:
          type: string
          example: A minor
        instruments:
          type: object
          required: [guitar, banjo, mandolin, piano]
          properties:
            guitar:
              $ref: "#/components/schemas/StringedVoicing"
            banjo:
              $ref: "#/components/schemas/StringedVoicing"
            mandolin:
              $ref: "#/components/schemas/StringedVoicing"
            piano:
              $ref: "#/components/schemas/PianoVoicing"

    StringedVoicing:
      type: object
      required: [frets, fingers, position]
      properties:
        frets:
          type: array
          items:
            type: integer
          description: "-1 = muted, 0 = open"
        fingers:
          type: array
          items:
            type: integer
          description: "0 = no finger, 1-4 = finger number"
        position:
          type: integer
          description: Starting fret position
        barre:
          type: object
          properties:
            fret:
              type: integer
            strings:
              type: array
              items:
                type: integer

    PianoVoicing:
      type: object
      required: [keys]
      properties:
        keys:
          type: array
          items:
            type: string
          description: "e.g. [\"A3\", \"C4\", \"E4\"]"
```

### Step 2: Validate spec (install vacuum or use online linter)

```bash
# Install vacuum OAS linter
brew install daveshanley/vacuum/vacuum
vacuum lint api/openapi/spec.yaml
# Expected: no errors
```

### Step 3: Commit

```bash
git add api/openapi/spec.yaml
git commit -m "feat: add OpenAPI 3.1 spec for ChordFinder API"
```

---

## Task 3: Go API — Session Management

**Files:**
- Create: `api/internal/transport/sessions.go`
- Create: `api/internal/transport/sessions_test.go`

### Step 1: Write failing test

```go
// api/internal/transport/sessions_test.go
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
    // Create a session first
    req := httptest.NewRequest(http.MethodPost, "/sessions", nil)
    w := httptest.NewRecorder()
    h.CreateSession(w, req)
    var body map[string]string
    json.NewDecoder(w.Body).Decode(&body)
    sessionID := body["session_id"]

    // Delete it
    req2 := httptest.NewRequest(http.MethodDelete, "/sessions/"+sessionID, nil)
    w2 := httptest.NewRecorder()
    h.DeleteSession(w2, req2, sessionID)
    if w2.Code != http.StatusNoContent {
        t.Fatalf("expected 204, got %d", w2.Code)
    }
}
```

### Step 2: Run test to verify it fails

```bash
cd api && go test ./internal/transport/... -v
# Expected: FAIL — transport package doesn't exist yet
```

### Step 3: Implement sessions handler

```go
// api/internal/transport/sessions.go
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
```

### Step 4: Run tests and verify pass

```bash
cd api && go test ./internal/transport/... -v
# Expected: PASS
```

### Step 5: Wire into main.go

```go
// api/main.go
package main

import (
    "log"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/chordfinder/api/internal/transport"
)

func main() {
    h := transport.NewHandler()
    r := chi.NewRouter()

    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })
    r.Post("/sessions", h.CreateSession)
    r.Delete("/sessions/{sessionID}", func(w http.ResponseWriter, req *http.Request) {
        h.DeleteSession(w, req, chi.URLParam(req, "sessionID"))
    })

    log.Println("ChordFinder API listening on :8080")
    log.Fatal(http.ListenAndServe(":8080", r))
}
```

### Step 6: Smoke test

```bash
cd api && go run main.go &
curl -s -X POST http://localhost:8080/sessions | jq .
# Expected: { "session_id": "...", "websocket_url": "..." }
kill %1
```

### Step 7: Commit

```bash
git add api/
git commit -m "feat: add session create/delete endpoints"
```

---

## Task 4: Go API — WebSocket Streaming Hub

**Files:**
- Create: `api/internal/transport/hub.go`
- Create: `api/internal/transport/hub_test.go`

### Step 1: Write failing test

```go
// api/internal/transport/hub_test.go
package transport_test

import (
    "net/http/httptest"
    "strings"
    "testing"

    "github.com/gorilla/websocket"
    "github.com/chordfinder/api/internal/transport"
)

func TestWebSocketUpgrade(t *testing.T) {
    h := transport.NewHandler()
    srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Create a session first
        id := "test-session"
        h.RegisterSession(id)
        h.ServeStream(w, r, id)
    }))
    defer srv.Close()

    url := "ws" + strings.TrimPrefix(srv.URL, "http")
    conn, _, err := websocket.DefaultDialer.Dial(url, nil)
    if err != nil {
        t.Fatalf("websocket dial failed: %v", err)
    }
    defer conn.Close()

    // Read the initial status event
    _, msg, err := conn.ReadMessage()
    if err != nil {
        t.Fatalf("read failed: %v", err)
    }
    if !strings.Contains(string(msg), "listening") {
        t.Errorf("expected 'listening' status, got: %s", msg)
    }
}
```

### Step 2: Run test — verify it fails

```bash
cd api && go test ./internal/transport/... -run TestWebSocket -v
# Expected: FAIL
```

### Step 3: Implement WebSocket hub

```go
// api/internal/transport/hub.go
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

type client struct {
    conn   *websocket.Conn
    send   chan WSEvent
}

var (
    clientsMu sync.RWMutex
    clients   = map[string]*client{}
)

func (h *Handler) RegisterSession(id string) {
    // ensures session exists in handler map
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

    c := &client{conn: conn, send: make(chan WSEvent, 32)}
    clientsMu.Lock()
    clients[sessionID] = c
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

    // Reader goroutine — receives binary PCM audio, forwards to chord worker
    go func() {
        defer func() {
            clientsMu.Lock()
            delete(clients, sessionID)
            clientsMu.Unlock()
            close(c.send)
        }()
        for {
            msgType, data, err := conn.ReadMessage()
            if err != nil {
                return
            }
            if msgType == websocket.BinaryMessage {
                // TODO Task 5: forward to chord worker
                _ = data
            }
        }
    }()
}

// BroadcastEvent sends an event to the client for a given session
func BroadcastEvent(sessionID string, evt WSEvent) {
    clientsMu.RLock()
    c, ok := clients[sessionID]
    clientsMu.RUnlock()
    if ok {
        select {
        case c.send <- evt:
        default:
        }
    }
}
```

### Step 4: Add stream route to main.go

```go
// Add to main.go router setup:
r.Get("/sessions/{sessionID}/stream", func(w http.ResponseWriter, req *http.Request) {
    h.ServeStream(w, req, chi.URLParam(req, "sessionID"))
})
```

### Step 5: Run tests

```bash
cd api && go test ./internal/transport/... -v
# Expected: PASS
```

### Step 6: Commit

```bash
git add api/
git commit -m "feat: add WebSocket streaming hub for audio sessions"
```

---

## Task 5: Go Chord Detection Engine

**Files:**
- Create: `api/internal/chords/detector.go`
- Create: `api/internal/chords/detector_test.go`
- Create: `api/internal/chords/sections.go`
- Create: `api/internal/chords/sections_test.go`

### Step 1: Add go-dsp dependency

```bash
cd api
go get github.com/mjibson/go-dsp/fft
```

### Step 2: Write failing detector test

```go
// api/internal/chords/detector_test.go
package chords_test

import (
    "math"
    "testing"

    "github.com/chordfinder/api/internal/chords"
)

func makeSine(freqHz, durationS float64, sr int) []float32 {
    n := int(durationS * float64(sr))
    samples := make([]float32, n)
    for i := range samples {
        samples[i] = float32(math.Sin(2 * math.Pi * freqHz * float64(i) / float64(sr)))
    }
    return samples
}

func TestDetectChordReturnsSomething(t *testing.T) {
    audio := makeSine(440.0, 1.0, 16000) // A4
    result := chords.DetectChord(audio, 16000)
    if result.Name == "" {
        t.Error("expected a chord name")
    }
    if result.Confidence == "" {
        t.Error("expected a confidence level")
    }
}

func TestDetectChordSilenceReturnsUnknown(t *testing.T) {
    silence := make([]float32, 16000)
    result := chords.DetectChord(silence, 16000)
    if result.Name != "?" {
        t.Errorf("expected '?' for silence, got %s", result.Name)
    }
}

func TestConfidenceIsValid(t *testing.T) {
    audio := makeSine(261.63, 1.0, 16000) // C4
    result := chords.DetectChord(audio, 16000)
    valid := map[string]bool{"high": true, "medium": true, "low": true}
    if !valid[result.Confidence] {
        t.Errorf("unexpected confidence: %s", result.Confidence)
    }
}
```

### Step 3: Run test — verify it fails

```bash
cd api && go test ./internal/chords/... -run TestDetect -v
# Expected: FAIL — chords.DetectChord not defined
```

### Step 4: Implement detector.go

```go
// api/internal/chords/detector.go
package chords

import (
    "math"
    "math/cmplx"

    "github.com/mjibson/go-dsp/fft"
)

// DetectionResult holds a chord name and confidence level.
type DetectionResult struct {
    Name       string
    Confidence string // "high", "medium", "low"
}

var chordTemplates map[string][12]float64

func init() {
    chordTemplates = buildTemplates()
}

func buildTemplates() map[string][12]float64 {
    notes := []string{"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}
    types := []struct {
        suffix    string
        intervals []int
    }{
        {"", []int{0, 4, 7}},
        {"m", []int{0, 3, 7}},
        {"7", []int{0, 4, 7, 10}},
        {"maj7", []int{0, 4, 7, 11}},
        {"m7", []int{0, 3, 7, 10}},
    }

    templates := make(map[string][12]float64)
    for rootIdx, root := range notes {
        for _, ct := range types {
            var chroma [12]float64
            for _, interval := range ct.intervals {
                chroma[(rootIdx+interval)%12] = 1.0
            }
            norm := l2Norm(chroma)
            if norm > 0 {
                for i := range chroma {
                    chroma[i] /= norm
                }
            }
            templates[root+ct.suffix] = chroma
        }
    }
    return templates
}

// DetectChord detects the most likely chord in a PCM audio buffer.
// audio: mono float32 samples, sr: sample rate in Hz.
func DetectChord(audio []float32, sr int) DetectionResult {
    if rms(audio) < 0.001 {
        return DetectionResult{Name: "?", Confidence: "low"}
    }

    chroma := computeChroma(audio, sr)
    norm := l2Norm(chroma)
    if norm < 1e-6 {
        return DetectionResult{Name: "?", Confidence: "low"}
    }
    for i := range chroma {
        chroma[i] /= norm
    }

    bestName := "?"
    bestScore := -1.0
    for name, template := range chordTemplates {
        score := dot(chroma, template)
        if score > bestScore {
            bestScore = score
            bestName = name
        }
    }

    var confidence string
    switch {
    case bestScore > 0.85:
        confidence = "high"
    case bestScore > 0.70:
        confidence = "medium"
    default:
        confidence = "low"
    }
    return DetectionResult{Name: bestName, Confidence: confidence}
}

// computeChroma builds a 12-bin chromagram from the audio using FFT.
func computeChroma(audio []float32, sr int) [12]float64 {
    // Convert to float64 for FFT
    in := make([]float64, len(audio))
    for i, v := range audio {
        in[i] = float64(v)
    }

    spectrum := fft.FFTReal(in)
    n := len(spectrum)
    freqRes := float64(sr) / float64(len(in))

    var chroma [12]float64
    for k := 1; k < n/2; k++ {
        freq := float64(k) * freqRes
        if freq < 27.5 || freq > 4186 { // piano range A0–C8
            continue
        }
        magnitude := cmplx.Abs(spectrum[k])
        // Map frequency to chroma bin (pitch class)
        // MIDI note: 12 * log2(f/440) + 69
        midi := 12*math.Log2(freq/440.0) + 69
        bin := int(math.Round(midi)) % 12
        if bin < 0 {
            bin += 12
        }
        chroma[bin] += magnitude
    }
    return chroma
}

func rms(samples []float32) float64 {
    var sum float64
    for _, v := range samples {
        sum += float64(v) * float64(v)
    }
    return math.Sqrt(sum / float64(len(samples)))
}

func l2Norm(v [12]float64) float64 {
    var sum float64
    for _, x := range v {
        sum += x * x
    }
    return math.Sqrt(sum)
}

func dot(a, b [12]float64) float64 {
    var sum float64
    for i := range a {
        sum += a[i] * b[i]
    }
    return sum
}
```

### Step 5: Run tests — verify pass

```bash
cd api && go test ./internal/chords/... -run TestDetect -v
# Expected: PASS
```

### Step 6: Write failing section detector test

```go
// api/internal/chords/sections_test.go
package chords_test

import (
    "testing"

    "github.com/chordfinder/api/internal/chords"
)

func TestSectionDetectorAccumulates(t *testing.T) {
    sd := chords.NewSectionDetector()
    for i := 0; i < 10; i++ {
        sd.AddChord("C", "high")
        sd.AddChord("G", "high")
    }
    sections := sd.GetSections()
    if len(sections) == 0 {
        t.Error("expected at least one section")
    }
}

func TestSectionDetectorLabelFormat(t *testing.T) {
    sd := chords.NewSectionDetector()
    for _, c := range []string{"Am", "F", "C", "G", "Am", "F", "C", "G"} {
        sd.AddChord(c, "high")
    }
    sections := sd.GetSections()
    if len(sections) == 0 {
        t.Fatal("expected sections")
    }
    if sections[0].Label == "" {
        t.Error("expected non-empty label")
    }
    if len(sections[0].Chords) == 0 {
        t.Error("expected chords in section")
    }
}

func TestSectionDetectorIgnoresLowConfidenceUnknown(t *testing.T) {
    sd := chords.NewSectionDetector()
    for i := 0; i < 5; i++ {
        sd.AddChord("?", "low")
    }
    for _, c := range []string{"C", "G", "Am", "F", "C", "G", "Am", "F"} {
        sd.AddChord(c, "high")
    }
    sections := sd.GetSections()
    for _, s := range sections {
        for _, chord := range s.Chords {
            if chord == "?" {
                t.Error("unknown chord should not appear in sections")
            }
        }
    }
}
```

### Step 7: Run test — verify it fails

```bash
cd api && go test ./internal/chords/... -run TestSection -v
# Expected: FAIL
```

### Step 8: Implement sections.go

```go
// api/internal/chords/sections.go
package chords

const sectionWindow = 8

// Section represents a detected song section.
type Section struct {
    Label  string
    Chords []string
}

// SectionDetector accumulates chords and groups them into labeled sections.
type SectionDetector struct {
    chords []string
}

func NewSectionDetector() *SectionDetector {
    return &SectionDetector{}
}

func (sd *SectionDetector) AddChord(name, confidence string) {
    if name == "?" && confidence == "low" {
        return
    }
    sd.chords = append(sd.chords, name)
}

func (sd *SectionDetector) GetSections() []Section {
    if len(sd.chords) == 0 {
        return nil
    }

    seen := map[string]string{}
    var sections []Section
    labelIdx := 0

    for i := 0; i < len(sd.chords); i += sectionWindow {
        end := i + sectionWindow
        if end > len(sd.chords) {
            end = len(sd.chords)
        }
        chunk := sd.chords[i:end]
        key := joinChords(chunk)

        label, ok := seen[key]
        if !ok {
            label = "Section " + string(rune('A'+labelIdx))
            seen[key] = label
            labelIdx++
        }
        if len(sections) > 0 && sections[len(sections)-1].Label == label {
            continue
        }
        sections = append(sections, Section{
            Label:  label,
            Chords: unique(chunk),
        })
    }
    return sections
}

func joinChords(chords []string) string {
    result := ""
    for i, c := range chords {
        if i > 0 {
            result += ","
        }
        result += c
    }
    return result
}

func unique(chords []string) []string {
    seen := map[string]bool{}
    var result []string
    for _, c := range chords {
        if !seen[c] {
            seen[c] = true
            result = append(result, c)
        }
    }
    return result
}
```

### Step 9: Wire detector into WebSocket hub

In `api/internal/transport/hub.go`, update `ServeStream` to process audio:

```go
// In the reader goroutine, replace the TODO with:
detector := chords.NewSectionDetector()
// buffer for accumulating PCM samples
var pcmBuf []float32
const chunkSamples = 4000 // 250ms at 16kHz

if msgType == websocket.BinaryMessage {
    // data is raw 16-bit PCM, little-endian
    for i := 0; i+1 < len(data); i += 2 {
        sample := int16(data[i]) | int16(data[i+1])<<8
        pcmBuf = append(pcmBuf, float32(sample)/32768.0)
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
```

### Step 10: Run all chords tests

```bash
cd api && go test ./internal/chords/... -v && go build ./...
# Expected: all PASS, build succeeds
```

### Step 11: Commit

```bash
git add api/
git commit -m "feat: add Go-native chord detection engine (FFT chroma + template matching + section segmentation)"
```

---

## Task 6 (removed — merged into Task 5)

---

## Task 7: Chord Voicing Database

**Files:**
- Create: `api/data/chords.json`
- Create: `api/internal/chords/library.go`
- Create: `api/internal/chords/library_test.go`

### Step 1: Write failing test

```go
// api/internal/chords/library_test.go
package chords_test

import (
    "testing"
    "github.com/chordfinder/api/internal/chords"
)

func TestGetChord(t *testing.T) {
    lib, err := chords.LoadLibrary("../../data/chords.json")
    if err != nil {
        t.Fatalf("failed to load library: %v", err)
    }

    voicing, err := lib.Get("Am")
    if err != nil {
        t.Fatalf("expected Am to exist: %v", err)
    }
    if voicing.Name != "Am" {
        t.Errorf("expected name Am, got %s", voicing.Name)
    }
    if len(voicing.Instruments.Guitar.Frets) == 0 {
        t.Error("expected guitar frets")
    }
    if len(voicing.Instruments.Piano.Keys) == 0 {
        t.Error("expected piano keys")
    }
}

func TestUnknownChordReturnsError(t *testing.T) {
    lib, _ := chords.LoadLibrary("../../data/chords.json")
    _, err := lib.Get("Xyz999")
    if err == nil {
        t.Error("expected error for unknown chord")
    }
}
```

### Step 2: Run — verify it fails

```bash
cd api && go test ./internal/chords/... -run TestGetChord -v
```

### Step 3: Create chord data file (excerpt — full file covers ~150 chords)

```json
// api/data/chords.json
{
  "Am": {
    "name": "Am",
    "display_name": "A minor",
    "instruments": {
      "guitar": {
        "frets": [0, 0, 2, 2, 1, 0],
        "fingers": [0, 0, 2, 3, 1, 0],
        "position": 0,
        "barre": null
      },
      "banjo": {
        "frets": [0, 2, 2, 1, -1],
        "fingers": [0, 2, 3, 1, 0],
        "position": 0,
        "barre": null
      },
      "mandolin": {
        "frets": [2, 2, 1, 0],
        "fingers": [2, 3, 1, 0],
        "position": 0,
        "barre": null
      },
      "piano": {
        "keys": ["A3", "C4", "E4"]
      }
    }
  },
  "C": {
    "name": "C",
    "display_name": "C major",
    "instruments": {
      "guitar": {
        "frets": [0, 3, 2, 0, 1, 0],
        "fingers": [0, 3, 2, 0, 1, 0],
        "position": 0,
        "barre": null
      },
      "banjo": {
        "frets": [0, 1, 0, 2, -1],
        "fingers": [0, 1, 0, 2, 0],
        "position": 0,
        "barre": null
      },
      "mandolin": {
        "frets": [2, 3, 2, 0],
        "fingers": [1, 3, 2, 0],
        "position": 0,
        "barre": null
      },
      "piano": {
        "keys": ["C4", "E4", "G4"]
      }
    }
  }
}
```

> **Note:** The full `chords.json` must cover all chords the detector can return. Generate remaining ~148 chords using the same schema. A script in `worker/generate_chords.py` can output this data systematically.

### Step 4: Implement library.go

```go
// api/internal/chords/library.go
package chords

import (
    "encoding/json"
    "fmt"
    "os"
)

type StringedVoicing struct {
    Frets    []int   `json:"frets"`
    Fingers  []int   `json:"fingers"`
    Position int     `json:"position"`
    Barre    *Barre  `json:"barre"`
}

type Barre struct {
    Fret    int   `json:"fret"`
    Strings []int `json:"strings"`
}

type PianoVoicing struct {
    Keys []string `json:"keys"`
}

type Instruments struct {
    Guitar   StringedVoicing `json:"guitar"`
    Banjo    StringedVoicing `json:"banjo"`
    Mandolin StringedVoicing `json:"mandolin"`
    Piano    PianoVoicing    `json:"piano"`
}

type ChordVoicing struct {
    Name        string      `json:"name"`
    DisplayName string      `json:"display_name"`
    Instruments Instruments `json:"instruments"`
}

type Library struct {
    chords map[string]ChordVoicing
}

func LoadLibrary(path string) (*Library, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, err
    }
    var chords map[string]ChordVoicing
    if err := json.Unmarshal(data, &chords); err != nil {
        return nil, err
    }
    return &Library{chords: chords}, nil
}

func (l *Library) Get(name string) (ChordVoicing, error) {
    v, ok := l.chords[name]
    if !ok {
        return ChordVoicing{}, fmt.Errorf("chord %q not found", name)
    }
    return v, nil
}
```

### Step 5: Add GET /chords/{chordName} endpoint

```go
// api/internal/transport/chords_handler.go
package transport

import (
    "encoding/json"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/chordfinder/api/internal/chords"
)

func (h *Handler) GetChord(lib *chords.Library) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        name := chi.URLParam(r, "chordName")
        voicing, err := lib.Get(name)
        if err != nil {
            http.Error(w, "chord not found", http.StatusNotFound)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(voicing)
    }
}
```

### Step 6: Run tests

```bash
cd api && go test ./internal/chords/... -v
# Expected: PASS
```

### Step 7: Commit

```bash
git add api/
git commit -m "feat: add chord voicing library and GET /chords endpoint"
```

---

## Task 8: React Native — Project Structure & Navigation

**Files:**
- Create: `app/src/screens/HomeScreen.tsx`
- Create: `app/src/screens/ListeningScreen.tsx`
- Create: `app/src/screens/ResultsScreen.tsx`
- Create: `app/src/screens/ChordDetailScreen.tsx`
- Create: `app/src/navigation/AppNavigator.tsx`

### Step 1: Install navigation

```bash
cd app
npx expo install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
```

### Step 2: Create screen stubs

```tsx
// app/src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = { navigation: NativeStackNavigationProp<any> };

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ChordFinder</Text>
      <Pressable style={styles.listenButton} onPress={() => navigation.navigate("Listening")}>
        <Text style={styles.listenText}>Listen</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f0f0f" },
  title: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 48 },
  listenButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: "#6c47ff", alignItems: "center", justifyContent: "center" },
  listenText: { fontSize: 22, fontWeight: "600", color: "#fff" },
});
```

Create similar stubs for `ListeningScreen`, `ResultsScreen`, `ChordDetailScreen` (just `<Text>` placeholders for now).

### Step 3: Create AppNavigator

```tsx
// app/src/navigation/AppNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { ListeningScreen } from "../screens/ListeningScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { ChordDetailScreen } from "../screens/ChordDetailScreen";

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Listening" component={ListeningScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="ChordDetail" component={ChordDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Step 4: Wire into App.tsx

```tsx
// app/App.tsx
import { AppNavigator } from "./src/navigation/AppNavigator";
export default function App() {
  return <AppNavigator />;
}
```

### Step 5: Run on simulator

```bash
cd app && npx expo start
# Press 'i' for iOS simulator, 'a' for Android emulator
# Expected: ChordFinder home screen with Listen button
```

### Step 6: Commit

```bash
git add app/
git commit -m "feat: add React Native navigation scaffold and screen stubs"
```

---

## Task 9: React Native — InstrumentPicker & State

**Files:**
- Create: `app/src/components/InstrumentPicker.tsx`
- Create: `app/src/hooks/useInstrument.ts`

### Step 1: Implement InstrumentPicker

```tsx
// app/src/components/InstrumentPicker.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export type Instrument = "guitar" | "banjo" | "mandolin" | "piano";
const INSTRUMENTS: Instrument[] = ["guitar", "banjo", "mandolin", "piano"];

type Props = {
  selected: Instrument;
  onSelect: (instrument: Instrument) => void;
};

export function InstrumentPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {INSTRUMENTS.map((inst) => (
        <Pressable
          key={inst}
          style={[styles.tab, selected === inst && styles.activeTab]}
          onPress={() => onSelect(inst)}
        >
          <Text style={[styles.label, selected === inst && styles.activeLabel]}>
            {inst.charAt(0).toUpperCase() + inst.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", backgroundColor: "#1a1a1a", borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  activeTab: { backgroundColor: "#6c47ff" },
  label: { color: "#888", fontSize: 13, fontWeight: "500" },
  activeLabel: { color: "#fff" },
});
```

### Step 2: Implement useInstrument hook

```ts
// app/src/hooks/useInstrument.ts
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Instrument } from "../components/InstrumentPicker";

const KEY = "@chordfinder:instrument";

export function useInstrument() {
  const [instrument, setInstrumentState] = useState<Instrument>("guitar");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => {
      if (val) setInstrumentState(val as Instrument);
    });
  }, []);

  const setInstrument = (inst: Instrument) => {
    setInstrumentState(inst);
    AsyncStorage.setItem(KEY, inst);
  };

  return { instrument, setInstrument };
}
```

### Step 3: Add picker to HomeScreen

```tsx
// In HomeScreen.tsx, add:
import { InstrumentPicker } from "../components/InstrumentPicker";
import { useInstrument } from "../hooks/useInstrument";

// Inside component:
const { instrument, setInstrument } = useInstrument();
// Render below title:
<InstrumentPicker selected={instrument} onSelect={setInstrument} />
```

### Step 4: Commit

```bash
git add app/
git commit -m "feat: add InstrumentPicker component with AsyncStorage persistence"
```

---

## Task 10: React Native — useListeningSession Hook

**Files:**
- Create: `app/src/hooks/useListeningSession.ts`
- Create: `app/src/types/api.ts`

### Step 1: Define API types

```ts
// app/src/types/api.ts
export type WSEventType = "section" | "chord_update" | "status";

export interface WSEvent {
  type: WSEventType;
  label?: string;
  section?: string;
  chords?: string[];
  confidence?: "high" | "medium" | "low";
  state?: "listening" | "processing" | "complete" | "no_signal" | "error";
}

export interface Section {
  label: string;
  chords: string[];
}

export interface SessionState {
  status: "idle" | "listening" | "no_signal" | "error" | "complete";
  sections: Section[];
}
```

### Step 2: Implement useListeningSession

```ts
// app/src/hooks/useListeningSession.ts
import { useState, useRef, useCallback } from "react";
import { SessionState, Section, WSEvent } from "../types/api";

const API_BASE = "http://localhost:8080"; // update for production

export function useListeningSession() {
  const [state, setState] = useState<SessionState>({ status: "idle", sections: [] });
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const start = useCallback(async () => {
    setState({ status: "listening", sections: [] });

    // Create session
    const res = await fetch(`${API_BASE}/sessions`, { method: "POST" });
    const { session_id, websocket_url } = await res.json();
    sessionIdRef.current = session_id;

    const ws = new WebSocket(websocket_url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const evt: WSEvent = JSON.parse(e.data);
      setState((prev) => {
        if (evt.type === "status") {
          return { ...prev, status: (evt.state as SessionState["status"]) ?? prev.status };
        }
        if (evt.type === "chord_update" && evt.section && evt.chords) {
          const sections = [...prev.sections];
          const idx = sections.findIndex((s) => s.label === evt.section);
          if (idx >= 0) {
            sections[idx] = { label: evt.section, chords: evt.chords };
          } else {
            sections.push({ label: evt.section!, chords: evt.chords! });
          }
          return { ...prev, sections };
        }
        return prev;
      });
    };

    ws.onerror = () => setState((prev) => ({ ...prev, status: "error" }));
    ws.onclose = () => setState((prev) => ({ ...prev, status: prev.status === "listening" ? "complete" : prev.status }));

    // TODO Task 11: start sending microphone audio over ws
  }, []);

  const stop = useCallback(async () => {
    wsRef.current?.close();
    if (sessionIdRef.current) {
      await fetch(`${API_BASE}/sessions/${sessionIdRef.current}`, { method: "DELETE" });
    }
    setState((prev) => ({ ...prev, status: "complete" }));
  }, []);

  return { state, start, stop };
}
```

### Step 3: Commit

```bash
git add app/
git commit -m "feat: add useListeningSession hook with WebSocket session management"
```

---

## Task 11: React Native — Microphone Audio Streaming

**Files:**
- Create: `app/src/hooks/useMicrophone.ts`
- Modify: `app/src/hooks/useListeningSession.ts`

### Step 1: Implement microphone capture

```ts
// app/src/hooks/useMicrophone.ts
import { Audio } from "expo-av";
import { useRef, useCallback } from "react";

export function useMicrophone(onChunk: (pcmBase64: string) => void) {
  const recordingRef = useRef<Audio.Recording | null>(null);

  const start = useCallback(async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recordingRef.current = recording;

    // Poll for audio data every 250ms
    const interval = setInterval(async () => {
      const status = await recording.getStatusAsync();
      if (status.isRecording) {
        // Expo doesn't expose raw PCM directly — use recording URI + fetch for chunks
        // In production, use react-native-audio-record for true PCM streaming
        // For now, send the URI event as a placeholder
        onChunk(""); // placeholder
      }
    }, 250);

    return () => clearInterval(interval);
  }, [onChunk]);

  const stop = useCallback(async () => {
    await recordingRef.current?.stopAndUnloadAsync();
  }, []);

  return { start, stop };
}
```

> **Note:** True PCM streaming from React Native requires `react-native-audio-record` or `expo-audio` (beta). The above is a working placeholder for simulator testing. Wire in `react-native-audio-record` for production PCM streaming over WebSocket binary frames.

### Step 2: Commit

```bash
git add app/
git commit -m "feat: add microphone capture hook (placeholder PCM streaming)"
```

---

## Task 12: React Native — ChordDiagram SVG Component

**Files:**
- Create: `app/src/components/ChordDiagram.tsx`
- Create: `app/src/components/GuitarDiagram.tsx`
- Create: `app/src/components/PianoDiagram.tsx`

### Step 1: Implement GuitarDiagram (SVG fret chart)

```tsx
// app/src/components/GuitarDiagram.tsx
import React from "react";
import Svg, { Line, Circle, Text, Rect } from "react-native-svg";

interface Props {
  frets: number[];    // -1=muted, 0=open, N=fret number
  fingers: number[];
  position: number;
  barre?: { fret: number; strings: number[] } | null;
}

const STRING_COUNT = 6;
const FRET_COUNT = 4;
const W = 120, H = 140;
const PAD = 16;
const STRING_SPACING = (W - PAD * 2) / (STRING_COUNT - 1);
const FRET_SPACING = (H - PAD * 2 - 20) / FRET_COUNT;

export function GuitarDiagram({ frets, fingers, position, barre }: Props) {
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* Nut */}
      <Rect x={PAD} y={PAD + 18} width={W - PAD * 2} height={3} fill="#fff" />
      {/* Fret lines */}
      {Array.from({ length: FRET_COUNT }).map((_, i) => (
        <Line
          key={i}
          x1={PAD} y1={PAD + 18 + (i + 1) * FRET_SPACING}
          x2={W - PAD} y2={PAD + 18 + (i + 1) * FRET_SPACING}
          stroke="#444" strokeWidth={1}
        />
      ))}
      {/* String lines */}
      {Array.from({ length: STRING_COUNT }).map((_, i) => (
        <Line
          key={i}
          x1={PAD + i * STRING_SPACING} y1={PAD + 18}
          x2={PAD + i * STRING_SPACING} y2={H - PAD}
          stroke="#555" strokeWidth={1}
        />
      ))}
      {/* Finger dots */}
      {frets.map((fret, i) => {
        const x = PAD + i * STRING_SPACING;
        if (fret === -1) {
          return <Text key={i} x={x} y={PAD + 12} fontSize={10} fill="#f55" textAnchor="middle">✕</Text>;
        }
        if (fret === 0) {
          return <Circle key={i} cx={x} cy={PAD + 9} r={5} fill="none" stroke="#aaa" strokeWidth={1.5} />;
        }
        const y = PAD + 18 + (fret - 0.5) * FRET_SPACING;
        return <Circle key={i} cx={x} cy={y} r={7} fill="#6c47ff" />;
      })}
    </Svg>
  );
}
```

### Step 2: Implement PianoDiagram

```tsx
// app/src/components/PianoDiagram.tsx
import React from "react";
import Svg, { Rect } from "react-native-svg";

const ALL_NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const WHITE_KEYS = ["C","D","E","F","G","A","B"];
const BLACK_KEYS = ["C#","D#","F#","G#","A#"];

interface Props { keys: string[] }

export function PianoDiagram({ keys }: Props) {
  const activeNotes = new Set(keys.map(k => k.replace(/\d/, "")));
  const W = 160, H = 80;
  const wKeyW = W / 14; // 2 octaves

  return (
    <Svg width={W} height={H}>
      {/* Simplified: render one octave C3-B4 */}
      {WHITE_KEYS.map((note, i) => (
        <Rect
          key={note}
          x={i * wKeyW * 2} y={0}
          width={wKeyW * 2 - 1} height={H}
          fill={activeNotes.has(note) ? "#6c47ff" : "#fff"}
          stroke="#333" strokeWidth={1}
        />
      ))}
    </Svg>
  );
}
```

### Step 3: Create ChordDiagram router component

```tsx
// app/src/components/ChordDiagram.tsx
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { GuitarDiagram } from "./GuitarDiagram";
import { PianoDiagram } from "./PianoDiagram";
import { Instrument } from "./InstrumentPicker";

interface Props {
  chordName: string;
  instrument: Instrument;
  voicingData?: any; // Loaded from GET /chords/{name}
}

export function ChordDiagram({ chordName, instrument, voicingData }: Props) {
  if (!voicingData) {
    return <ActivityIndicator />;
  }
  const v = voicingData.instruments[instrument];
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
        {voicingData.display_name ?? chordName}
      </Text>
      {instrument === "piano" ? (
        <PianoDiagram keys={v.keys} />
      ) : (
        <GuitarDiagram frets={v.frets} fingers={v.fingers} position={v.position} barre={v.barre} />
      )}
    </View>
  );
}
```

### Step 4: Commit

```bash
git add app/
git commit -m "feat: add SVG chord diagram components (guitar, piano)"
```

---

## Task 13: React Native — ListeningScreen & ResultsScreen

**Files:**
- Modify: `app/src/screens/ListeningScreen.tsx`
- Modify: `app/src/screens/ResultsScreen.tsx`

### Step 1: Implement ListeningScreen

```tsx
// app/src/screens/ListeningScreen.tsx
import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { useListeningSession } from "../hooks/useListeningSession";
import { useInstrument } from "../hooks/useInstrument";
import { InstrumentPicker } from "../components/InstrumentPicker";

export function ListeningScreen({ navigation }: any) {
  const { state, start, stop } = useListeningSession();
  const { instrument, setInstrument } = useInstrument();

  useEffect(() => { start(); return () => { stop(); }; }, []);

  return (
    <View style={styles.container}>
      <InstrumentPicker selected={instrument} onSelect={setInstrument} />
      <Text style={styles.status}>
        {state.status === "listening" ? "Listening..." : state.status}
      </Text>
      <FlatList
        data={state.sections}
        keyExtractor={(s) => s.label}
        renderItem={({ item }) => (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>{item.label}</Text>
            <Text style={styles.chords}>{item.chords.join(" — ")}</Text>
          </View>
        )}
      />
      <Pressable style={styles.stopButton} onPress={() => { stop(); navigation.navigate("Results", { sections: state.sections, instrument }); }}>
        <Text style={styles.stopText}>Stop</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f", padding: 16 },
  status: { color: "#aaa", textAlign: "center", marginVertical: 12 },
  sectionCard: { backgroundColor: "#1a1a1a", borderRadius: 8, padding: 12, marginBottom: 8 },
  sectionLabel: { color: "#6c47ff", fontWeight: "700", marginBottom: 4 },
  chords: { color: "#fff", fontSize: 15 },
  stopButton: { backgroundColor: "#f55", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 12 },
  stopText: { color: "#fff", fontWeight: "700" },
});
```

### Step 2: Implement ResultsScreen

```tsx
// app/src/screens/ResultsScreen.tsx
import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";

export function ResultsScreen({ route, navigation }: any) {
  const { sections, instrument } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Results</Text>
      {sections.map((section: any) => (
        <View key={section.label} style={styles.card}>
          <Text style={styles.label}>{section.label}</Text>
          <View style={styles.chordRow}>
            {section.chords.map((chord: string) => (
              <Pressable
                key={chord}
                style={styles.chordPill}
                onPress={() => navigation.navigate("ChordDetail", { chord, instrument })}
              >
                <Text style={styles.chordText}>{chord}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Pressable style={styles.homeButton} onPress={() => navigation.navigate("Home")}>
        <Text style={styles.homeText}>Listen Again</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  card: { backgroundColor: "#1a1a1a", borderRadius: 8, padding: 12, marginBottom: 10 },
  label: { color: "#6c47ff", fontWeight: "700", marginBottom: 8 },
  chordRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chordPill: { backgroundColor: "#2a2a2a", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chordText: { color: "#fff", fontWeight: "600" },
  homeButton: { backgroundColor: "#6c47ff", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 16 },
  homeText: { color: "#fff", fontWeight: "700" },
});
```

### Step 3: Commit

```bash
git add app/
git commit -m "feat: implement ListeningScreen and ResultsScreen"
```

---

## Task 14: Error Handling

**Files:**
- Modify: `api/internal/transport/hub.go` — session timeout, no-signal detection
- Modify: `app/src/hooks/useListeningSession.ts` — reconnect logic, permission handling
- Modify: `app/src/screens/ListeningScreen.tsx` — error banners

### Step 1: API — Session timeout (10 minutes)

In `hub.go` `ServeStream`, add a ticker:

```go
timeout := time.NewTimer(10 * time.Minute)
warning := time.NewTimer(9 * time.Minute)
go func() {
    select {
    case <-warning.C:
        c.send <- WSEvent{Type: "status", State: "warning_1min"}
    case <-timeout.C:
        c.send <- WSEvent{Type: "status", State: "complete"}
        conn.Close()
    }
}()
```

### Step 2: App — WebSocket auto-reconnect

In `useListeningSession.ts`, track reconnect attempts:

```ts
const reconnectAttempts = useRef(0);
// In ws.onclose:
ws.onclose = () => {
  if (reconnectAttempts.current < 3 && state.status === "listening") {
    reconnectAttempts.current++;
    setTimeout(start, 1000 * reconnectAttempts.current);
  } else {
    setState((prev) => ({ ...prev, status: "complete" }));
  }
};
```

### Step 3: App — Error banner in ListeningScreen

```tsx
{state.status === "no_signal" && (
  <View style={styles.banner}>
    <Text style={styles.bannerText}>No music detected — make sure music is playing</Text>
  </View>
)}
{state.status === "error" && (
  <View style={[styles.banner, { backgroundColor: "#f55" }]}>
    <Text style={styles.bannerText}>Connection lost. Reconnecting...</Text>
  </View>
)}
```

### Step 4: App — Microphone permission handling

```ts
// In useMicrophone.ts start():
const { granted } = await Audio.requestPermissionsAsync();
if (!granted) {
  Alert.alert(
    "Microphone Required",
    "ChordFinder needs microphone access to detect chords.",
    [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Cancel" }]
  );
  return;
}
```

### Step 5: Commit

```bash
git add api/ app/
git commit -m "feat: add error handling — session timeout, reconnect, permission prompt"
```

---

## Task 15: End-to-End Verification

### Step 1: Run all Go tests

```bash
cd api && go test ./... -v
# Expected: all PASS
```

### Step 2: Run all Python tests

```bash
cd worker && source .venv/bin/activate && python -m pytest tests/ -v
# Expected: all PASS
```

### Step 3: Run full stack locally

```bash
# Terminal 1 — API
cd api && go run main.go

# Terminal 2 — (worker is spawned by API automatically)

# Terminal 3 — App
cd app && npx expo start
```

### Step 4: Manual smoke test

1. Open app on iOS simulator
2. Select "Guitar"
3. Tap "Listen"
4. Play music from laptop speakers
5. Verify sections and chord names appear
6. Tap a chord pill → ChordDetail screen shows fret diagram
7. Switch instrument to Piano → diagram updates
8. Tap "Stop" → ResultsScreen shows all sections

### Step 5: Final commit

```bash
git add .
git commit -m "chore: complete ChordFinder v1 implementation"
```

---

## Task Dependencies Summary

```
Task 1  (Scaffolding)
├── Task 2  (OAS Spec)
├── Task 3  (Sessions API)
│   └── Task 4  (WebSocket Hub)
│       └── Task 6  (Worker Integration)
├── Task 5  (Python Worker)
│   └── Task 6  (Worker Integration)
├── Task 7  (Chord DB)
├── Task 8  (RN Navigation)
│   └── Task 9  (InstrumentPicker)
│       └── Task 10 (useListeningSession)
│           └── Task 11 (Microphone)
│               └── Task 13 (Screens)
└── Task 12 (ChordDiagram SVG)
    └── Task 13 (Screens)
        └── Task 14 (Error Handling)
            └── Task 15 (E2E Verification)
```
