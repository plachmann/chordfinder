# ChordFinder API

Go HTTP/WebSocket server that receives raw audio from a client, detects chord progressions using FFT-based analysis, and streams results back in real time.

Runs on port `8080`. Full schema is in [`openapi/spec.yaml`](openapi/spec.yaml).

---

## Endpoints

### `GET /health`

Returns `ok`. Use this to check that the server is reachable before starting a session.

---

### `POST /sessions`

Creates a new listening session and returns the session ID and the WebSocket URL the client should connect to.

**Response**
```json
{
  "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "websocket_url": "ws://localhost:8080/sessions/3fa85f64-.../stream"
}
```

Sessions are held in memory. There is no persistence — if the server restarts, all sessions are lost.

---

### `GET /sessions/{sessionID}/stream`

Upgrades the connection to a WebSocket. This is where all the real-time work happens.

**Client → Server**

Send binary frames containing raw PCM audio:
- 16-bit signed integers, little-endian
- Mono, 16 kHz sample rate
- ~250 ms per frame (4000 samples)

**Server → Client**

The server sends JSON text frames. There are two event types:

`status` — connection state changes
```json
{ "type": "status", "state": "listening" }
{ "type": "status", "state": "no_signal" }
```
States: `listening`, `no_signal`, `error`, `complete`

`chord_update` — a section's chord list has changed
```json
{
  "type": "chord_update",
  "section": "Section A",
  "chords": ["C", "Am", "F", "G"],
  "confidence": "high"
}
```

The server groups detected chords into sections of 8 chords each (labelled Section A, Section B, …). Each `chord_update` event carries the full, current chord list for that section — the client should replace, not append.

The connection closes automatically after 10 minutes of inactivity. If audio is silent for ~5 seconds, the server sends a `no_signal` status event; it sends `listening` again when audio resumes.

---

### `DELETE /sessions/{sessionID}`

Signals that the client is done. The session is removed from memory.

Returns `204 No Content` on success, `404` if the session does not exist.

---

### `GET /chords/{chordName}`

Returns fingering/voicing data for a named chord across all four instruments.

**Example:** `GET /chords/Cmaj7`

```json
{
  "name": "Cmaj7",
  "display_name": "C Major 7",
  "instruments": {
    "guitar":   { "frets": [-1, 3, 2, 0, 0, 0], "fingers": [0, 3, 2, 0, 0, 0], "position": 0 },
    "banjo":    { "frets": [0, 0, 0, 2], "position": 0 },
    "mandolin": { "frets": [0, 2, 0, 0], "position": 0 },
    "piano":    { "keys": ["C4", "E4", "G4", "B4"] }
  }
}
```

For stringed instruments, `frets` is an array with one entry per string. `-1` means muted, `0` means open. `position` is a capo or position offset — fret numbers in the array are absolute, so the diagram subtracts `position - 1` to get the relative fret. For piano, `keys` is a list of note names with octave numbers.

The chord database contains 60 chords (12 roots × 5 qualities: major, minor, 7, maj7, m7). Unrecognised chord names return `404`.

---

## How the app uses these endpoints

```
1. App launches
   └─ GET /health
      Confirms the server is reachable. If this fails, show a "can't connect" error
      and do not proceed.

2. User taps Listen
   └─ POST /sessions
      Creates a session. The response contains the websocket_url the app will
      use for streaming.

3. Audio streaming begins
   └─ GET /sessions/{sessionID}/stream  (WebSocket upgrade)
      The app opens this WebSocket and immediately starts receiving status events.
      Simultaneously, it begins capturing microphone audio (16 kHz mono PCM) and
      sending it as binary frames every 250 ms.

      As the server detects chords it sends chord_update events. The app updates
      the on-screen section list each time one arrives.

      If a no_signal event arrives, the app shows a banner: "No music detected".
      When audio resumes the server sends listening and the banner clears.

4. User taps Stop
   ├─ WebSocket is closed (the app stops sending audio)
   └─ DELETE /sessions/{sessionID}
      Cleans up the session on the server. The app then navigates to the
      Results screen with the final section/chord data it has accumulated.

5. User taps a chord on the Results screen
   └─ GET /chords/{chordName}
      Fetches the voicing for that chord and renders the appropriate diagram
      (guitar fret chart or piano keyboard) depending on the instrument the
      user selected.
```

---

## Running locally

```bash
cd api
go run .
```

Run tests:

```bash
go test ./...
```
