import React from "react";
import Svg, { Rect } from "react-native-svg";
import { colors } from "../theme";

const WHITE_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_POSITIONS: Record<string, number> = {
  "C#": 0.6, "D#": 1.6, "F#": 3.6, "G#": 4.6, "A#": 5.6,
};

const W = 175, H = 80;
const NUM_OCTAVES = 2;
const TOTAL_WHITE = WHITE_NOTES.length * NUM_OCTAVES;
const KEY_W = W / TOTAL_WHITE;
const BLACK_W = KEY_W * 0.65;
const BLACK_H = H * 0.6;

interface Props {
  keys: string[];
}

export function PianoDiagram({ keys }: Props) {
  const activeNotes = new Set(keys.map((k) => k.replace(/\d/, "")));

  const whiteKeys: React.ReactElement[] = [];
  const blackKeys: React.ReactElement[] = [];

  for (let oct = 0; oct < NUM_OCTAVES; oct++) {
    WHITE_NOTES.forEach((note, i) => {
      const x = (oct * WHITE_NOTES.length + i) * KEY_W;
      const active = activeNotes.has(note);
      whiteKeys.push(
        <Rect
          key={`w-${oct}-${note}`}
          x={x} y={0} width={KEY_W - 1} height={H}
          fill={active ? colors.accent : "#f0e6d0"}
          stroke="rgba(100,80,50,0.4)" strokeWidth={1} rx={2}
        />
      );
    });
    Object.entries(BLACK_POSITIONS).forEach(([note, pos]) => {
      const x = (oct * WHITE_NOTES.length + pos) * KEY_W - BLACK_W / 2;
      const active = activeNotes.has(note);
      blackKeys.push(
        <Rect
          key={`b-${oct}-${note}`}
          x={x} y={0} width={BLACK_W} height={BLACK_H}
          fill={active ? "#c47028" : "#2a1e14"}
          stroke="#1a1410" strokeWidth={1} rx={2}
        />
      );
    });
  }

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {whiteKeys}
      {blackKeys}
    </Svg>
  );
}
