import { useState, useRef, useCallback } from "react";
import { SessionState, Section, WSEvent } from "../types/api";
import { API_BASE } from "../config";

export function useListeningSession() {
  const [state, setState] = useState<SessionState>({ status: "idle", sections: [] });
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions`, { method: "POST" });
      const { session_id, websocket_url } = await res.json();
      sessionIdRef.current = session_id;

      const ws = new WebSocket(websocket_url);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const evt: WSEvent = JSON.parse(e.data);
        setState((prev) => {
          if (evt.type === "status") {
            if (evt.state === "no_signal") return { ...prev, status: "no_signal" };
            if (evt.state === "complete") return { ...prev, status: "complete" };
            if (evt.state === "error") return { ...prev, status: "error" };
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
      };

      ws.onerror = () => setState((prev) => ({ ...prev, status: "error" }));

      ws.onclose = () => {
        setState((prev) => {
          if (prev.status === "listening" && reconnectAttempts.current < 3) {
            reconnectAttempts.current++;
            setTimeout(connect, 1000 * reconnectAttempts.current);
            return prev;
          }
          return {
            ...prev,
            status: prev.status === "listening" ? "complete" : prev.status,
          };
        });
      };
    } catch {
      setState((prev) => ({ ...prev, status: "error" }));
    }
  }, []);

  const start = useCallback(async () => {
    setState({ status: "listening", sections: [] });
    reconnectAttempts.current = 0;
    await connect();
  }, [connect]);

  const stop = useCallback(async () => {
    wsRef.current?.close();
    if (sessionIdRef.current) {
      try {
        await fetch(`${API_BASE}/sessions/${sessionIdRef.current}`, { method: "DELETE" });
      } catch { /* ignore */ }
    }
    setState((prev) => ({ ...prev, status: "complete" }));
  }, []);

  return { state, start, stop };
}
