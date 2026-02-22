import { useState, useRef, useCallback } from "react";
import { SessionState, WSEvent } from "../types/api";
import { API_BASE } from "../config";
import {
  DEMO_PROGRESSION,
  CHUNKS_PER_CHORD,
  generatePCMChunk,
} from "../utils/syntheticAudio";

export function useListeningSession() {
  const [state, setState] = useState<SessionState>({ status: "idle", sections: [] });
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const reconnectAttempts = useRef(0);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleMessage = useCallback((e: MessageEvent) => {
    const evt: WSEvent = JSON.parse(e.data);
    setState((prev) => {
      if (evt.type === "status") {
        if (evt.state === "no_signal") return { ...prev, status: "no_signal" };
        if (evt.state === "complete") return { ...prev, status: "complete" };
        if (evt.state === "error") return { ...prev, status: "error" };
        if (evt.state === "listening") return { ...prev, status: "listening" };
        return prev;
      }
      if (evt.type === "chord_update" && evt.section && evt.chords) {
        const sections = [...prev.sections];
        const idx = sections.findIndex((s) => s.label === evt.section);
        if (idx >= 0) {
          sections[idx] = { label: evt.section!, chords: evt.chords! };
        } else {
          sections.push({ label: evt.section!, chords: evt.chords! });
        }
        return { ...prev, sections };
      }
      return prev;
    });
  }, []);

  const openWebSocket = useCallback(
    (websocket_url: string, onOpen?: (ws: WebSocket) => void) => {
      const ws = new WebSocket(websocket_url);
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";
      ws.onmessage = handleMessage;
      ws.onerror = () => setState((prev) => ({ ...prev, status: "error" }));
      ws.onclose = () => {
        setState((prev) => {
          if (prev.status === "listening" && reconnectAttempts.current < 3) {
            reconnectAttempts.current++;
            return prev;
          }
          return {
            ...prev,
            status: prev.status === "listening" ? "complete" : prev.status,
          };
        });
      };
      if (onOpen) ws.onopen = () => onOpen(ws);
    },
    [handleMessage]
  );

  // Real microphone mode — expo-av recording feeds PCM to the WebSocket.
  const start = useCallback(async () => {
    setState({ status: "listening", sections: [] });
    reconnectAttempts.current = 0;
    try {
      const res = await fetch(`${API_BASE}/sessions`, { method: "POST" });
      const { session_id, websocket_url } = await res.json();
      sessionIdRef.current = session_id;
      openWebSocket(websocket_url);
      // TODO: start expo-av recording and pipe PCM chunks to wsRef.current
    } catch {
      setState((prev) => ({ ...prev, status: "error" }));
    }
  }, [openWebSocket]);

  // Demo mode — sends synthetic PCM for a chord progression.
  const startDemo = useCallback(async () => {
    setState({ status: "listening", sections: [] });
    reconnectAttempts.current = 0;
    try {
      const res = await fetch(`${API_BASE}/sessions`, { method: "POST" });
      const { session_id, websocket_url } = await res.json();
      sessionIdRef.current = session_id;

      openWebSocket(websocket_url, (ws) => {
        let chordIdx = 0;
        let chunkIdx = 0;

        demoTimerRef.current = setInterval(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            clearInterval(demoTimerRef.current!);
            return;
          }
          const chord = DEMO_PROGRESSION[chordIdx];
          const pcm = generatePCMChunk(chord.freqs, chunkIdx);
          ws.send(pcm);

          chunkIdx++;
          if (chunkIdx >= CHUNKS_PER_CHORD) {
            chunkIdx = 0;
            chordIdx = (chordIdx + 1) % DEMO_PROGRESSION.length;
          }
        }, 250);
      });
    } catch {
      setState((prev) => ({ ...prev, status: "error" }));
    }
  }, [openWebSocket]);

  const stop = useCallback(async () => {
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    wsRef.current?.close();
    if (sessionIdRef.current) {
      try {
        await fetch(`${API_BASE}/sessions/${sessionIdRef.current}`, { method: "DELETE" });
      } catch { /* ignore */ }
    }
    setState((prev) => ({ ...prev, status: "complete" }));
  }, []);

  return { state, start, startDemo, stop };
}
