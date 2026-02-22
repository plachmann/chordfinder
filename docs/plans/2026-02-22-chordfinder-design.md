# ChordFinder — Design Document
_Date: 2026-02-22_

## Overview

ChordFinder is a mobile app (iOS + Android) that listens to music in real time and identifies the chord progression, broken down by song section. It's similar to Shazam but returns chord data instead of a song title.

Users select their instrument (guitar, banjo, mandolin, or piano) and see chord diagrams with names as the app identifies each section of the song.

---

## System Architecture

**Components:**
- **React Native app** — cross-platform iOS/Android
- **Go API server** — HTTP/WebSocket, OAS 3.1 spec as source of truth
- **Python chord detection worker** — audio analysis via librosa, called from Go via gRPC/subprocess

```
[React Native App]
      │
      │  HTTPS / WebSocket (OAS 3.1 REST API)
      ▼
[Go API Server]
      │
      ├── Audio ingestion & buffering
      ├── Session management
      ├── Response formatting
      └── gRPC / subprocess
            ▼
      [Python Chord Worker]
            ├── librosa (chromagram / FFT)
            ├── Chord template matching
            └── Section segmentation (Laplacian)

[Chord Voicing DB]  ←──  Go API
```

**Data Flow:**
1. User taps "Listen" — microphone starts
2. App streams audio chunks to Go API over WebSocket
3. Go API forwards chunks to Python worker
4. Worker returns chord labels + section events
5. Go API pushes events to app in real time
6. App renders chord diagrams for the selected instrument

**Task #1**

---

## API Design (OAS 3.1)

**Spec location:** `/api/openapi/spec.yaml`

### Endpoints

```
POST   /sessions
  ← { session_id, websocket_url }

WS     /sessions/{session_id}/stream
  → Client streams raw PCM audio (16kHz mono)
  ← Server events:
       { type: "section",      label: "Section A", chords: ["G", "Em", "C", "D"] }
       { type: "chord_update", section: "Section A", chords: ["Am", "F", "C", "G"] }
       { type: "status",       state: "listening" | "processing" | "complete" | "no_signal" }

DELETE /sessions/{session_id}

GET    /chords/{chord_name}
  ← { name, display_name, instruments: { guitar, banjo, mandolin, piano } }
```

### Go API Structure

```
/api
  main.go
  /internal
    /audio       — chunk ingestion, buffering
    /chords      — chord detection interface + worker client
    /sections    — section boundary logic
    /transport   — HTTP handlers, WebSocket hub
  /openapi
    spec.yaml
```

**Task #2**

---

## Chord Detection Engine

**Approach:** Chroma-based detection via Python worker

1. Audio → FFT → 12-bin Chromagram (librosa)
2. Chromagram → chord template matching → chord label
3. Chord sequence → Laplacian structural segmentation → section labels

**Section Labels (v1):** Heuristic — "Section A", "Section B", etc. True verse/chorus labeling deferred to v2.

**Accuracy expectations:**
- Simple diatonic chords (C, G, Am, F): high
- Extended chords (maj7, sus4, add9): moderate
- Dense jazz harmony: low — surfaced in UI via confidence indicator

**Task #3**

---

## React Native App

### Screen Structure

```
HomeScreen        — Listen button + InstrumentPicker
ListeningScreen   — Live waveform + real-time section/chord display
ResultsScreen     — Full section breakdown with chord diagrams
ChordDetailScreen — Tap any chord for full diagram + alternate voicings
```

### Key Components

- **InstrumentPicker** — tab bar: Guitar | Banjo | Mandolin | Piano
- **SectionCard** — section label + chord pills
- **ChordDiagram** — SVG-rendered fret chart or piano keyboard
- **LiveWaveform** — audio visualizer animation

### Chord Diagrams

API returns structured voicing data; app renders SVG client-side:
```
guitar:   { frets, fingers, barre, position }
piano:    { keys: ["A3", "C4", "E4"] }
```

### State Management

- `useListeningSession` hook manages WebSocket lifecycle
- Sections/chords accumulated from server events
- Instrument preference persisted in AsyncStorage

**Task #4**

---

## Data Model

```typescript
Session {
  id: string
  state: "listening" | "processing" | "complete" | "error"
  sections: Section[]
}

Section {
  label: string       // "Section A"
  start_ms: number
  end_ms: number
  chords: string[]    // ["Am", "F", "C", "G"]
}

ChordVoicing {
  name: string        // "Am"
  display_name: string
  instruments: {
    guitar:   GuitarVoicing
    banjo:    BanjoVoicing
    mandolin: MandolinVoicing
    piano:    PianoVoicing
  }
}

GuitarVoicing {
  frets: number[]     // -1 = muted
  fingers: number[]
  barre?: { fret: number, strings: number[] }
  position: number
}

PianoVoicing {
  keys: string[]      // ["A3", "C4", "E4"]
}
```

**Chord Library:** ~150 chords per instrument. Stored in Go API (JSON or PostgreSQL). Versioned independently.

**Task #5**

---

## Error Handling

| Scenario | API Behavior | App Behavior |
|---|---|---|
| Noisy audio | `confidence: low` on chords | Warning banner |
| No music detected | `status: no_signal` event | "No music detected" prompt |
| Low confidence chord | `confidence` below threshold | Show `?` placeholder |
| WebSocket disconnect | — | Auto-reconnect x3, then error UI |
| Mic permission denied | — | In-app prompt + Settings deep link |
| Session > 10 min | API closes session | App warns at 9 min, ends at 10 |

**Task #6**

---

## Task Dependencies

```
#1 Scaffolding
   ├── #2 Go API          (blocked by #1)
   ├── #3 Python Worker   (blocked by #1)
   ├── #4 React Native    (blocked by #1)
   ├── #5 Chord DB        (blocked by #1)
   └── #6 Error Handling  (blocked by #2, #3, #4, #5)
```
