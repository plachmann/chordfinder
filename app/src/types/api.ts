export type WSEventType = "section" | "chord_update" | "status";

export interface WSEvent {
  type: WSEventType;
  label?: string;
  section?: string;
  chords?: string[];
  confidence?: "high" | "medium" | "low";
  state?: "listening" | "processing" | "complete" | "no_signal" | "error" | "warning_1min";
}

export interface Section {
  label: string;
  chords: string[];
}

export interface SessionState {
  status: "idle" | "listening" | "no_signal" | "error" | "complete";
  sections: Section[];
}

export type Instrument = "guitar" | "banjo" | "mandolin" | "piano";
