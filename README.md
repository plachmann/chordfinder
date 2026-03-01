# ChordFinder

Real-time chord progression detection for guitar, banjo, mandolin, and piano. Stream audio from your device, get chords identified on the fly, and browse interactive diagrams with multiple voicings.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile App | React Native 0.81.5, Expo 54, TypeScript |
| Navigation | React Navigation (native stack) |
| UI | react-native-svg, Animated API |
| Backend | Go 1.25, Chi v5 (HTTP router), Gorilla WebSocket |
| Audio Analysis | go-dsp (FFT), chromagram extraction, template matching |
| Communication | WebSocket (binary PCM streaming), REST (chord lookup) |
| Data | JSON chord library — 60 chords across 4 instruments |

## Features

- **Real-time chord detection** — Streams 16-bit PCM audio (16kHz mono) to the server. The server runs FFT, builds a chromagram, and matches against 60 chord templates (major, minor, 7, maj7, m7 across all 12 roots). Results stream back via WebSocket.
- **Multi-instrument diagrams** — Guitar (6-string fretboard), banjo (4-string), mandolin (4-string), and piano keyboard visualizations. Switch instruments on the results screen.
- **Multiple voicings per chord** — Browse open positions, barre chords, and piano inversions with prev/next navigation.
- **Chord progression sections** — Detected chords are grouped into labeled sections (Section A, B, C...) with deduplication.
- **Demo mode** — Generates synthetic audio (C–Am–F–G progression) so you can test without a microphone.
- **Animated UI** — Glowing listen orb, cascading chord chips, spring-animated bottom sheet for chord details.

## Project Structure

```
chordfinder/
├── api/                        # Go backend
│   ├── main.go                 # HTTP router & endpoints
│   ├── data/chords.json        # Chord voicing library
│   ├── openapi/spec.yaml       # OpenAPI 3.1 spec
│   └── internal/
│       ├── chords/             # Detector, library, section grouping
│       └── transport/          # WebSocket hub, session management
├── app/                        # React Native (Expo) app
│   ├── App.tsx                 # Root component
│   └── src/
│       ├── screens/            # Home, Listening, Results
│       ├── components/         # ListenOrb, ChordDiagram, GuitarDiagram, etc.
│       ├── hooks/              # useListeningSession, useInstrument
│       ├── config.ts           # API base URL
│       └── theme.ts            # Color palette
└── docs/                       # Design & planning docs
```

## Prerequisites

- **Go** 1.25+
- **Node.js** 18+
- **Expo Go** app on your phone (for device testing), or Xcode / Android Studio for simulators

## Running Locally

### 1. Start the API server

```bash
cd api
go run main.go
```

The server starts on `http://localhost:8080`.

### 2. Start the Expo app

```bash
cd app
npm install
npx expo start
```

Then:
- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with Expo Go on a physical device

### Testing on a physical device

Update `app/src/config.ts` with your machine's local IP:

```ts
export const API_BASE = "http://192.168.x.x:8080";
```

Your phone and computer must be on the same Wi-Fi network.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/sessions` | Create a listening session |
| `DELETE` | `/sessions/{id}` | End a session |
| `GET` | `/sessions/{id}/stream` | WebSocket — send PCM audio, receive chord events |
| `GET` | `/chords/{name}` | Fetch voicings for a chord |
