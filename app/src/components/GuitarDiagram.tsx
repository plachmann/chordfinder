import React from "react";
import Svg, { Line, Circle, Text as SvgText, Rect } from "react-native-svg";

interface Props {
  frets: number[];
  fingers?: number[];
  position?: number;
  barre?: { fret: number; strings: number[] } | null;
  stringCount?: number;
}

const W = 120, H = 140, PAD = 16, FRET_COUNT = 4;

export function GuitarDiagram({ frets, position = 0, stringCount = 6 }: Props) {
  const STRING_SPACING = (W - PAD * 2) / (stringCount - 1);
  const FRET_SPACING = (H - PAD * 2 - 20) / FRET_COUNT;
  const TOP = PAD + 20;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {position > 0 && (
        <SvgText x={W - 6} y={TOP + FRET_SPACING * 0.7} fontSize={10} fill="#aaa" textAnchor="end">
          {position}fr
        </SvgText>
      )}
      <Rect x={PAD} y={TOP - 1} width={W - PAD * 2} height={position > 0 ? 2 : 4} fill="#fff" />
      {Array.from({ length: FRET_COUNT }).map((_, i) => (
        <Line
          key={i}
          x1={PAD} y1={TOP + (i + 1) * FRET_SPACING}
          x2={W - PAD} y2={TOP + (i + 1) * FRET_SPACING}
          stroke="#444" strokeWidth={1}
        />
      ))}
      {Array.from({ length: stringCount }).map((_, i) => (
        <Line
          key={i}
          x1={PAD + i * STRING_SPACING} y1={TOP}
          x2={PAD + i * STRING_SPACING} y2={H - PAD}
          stroke="#555" strokeWidth={1.5}
        />
      ))}
      {frets.map((fret, i) => {
        const x = PAD + i * STRING_SPACING;
        if (fret === -1) {
          return (
            <SvgText key={i} x={x} y={TOP - 6} fontSize={11} fill="#f55" textAnchor="middle">
              ✕
            </SvgText>
          );
        }
        if (fret === 0) {
          return (
            <Circle key={i} cx={x} cy={TOP - 8} r={5} fill="none" stroke="#aaa" strokeWidth={1.5} />
          );
        }
        const relFret = position > 0 ? fret - position + 1 : fret;
        const y = TOP + (relFret - 0.5) * FRET_SPACING;
        return <Circle key={i} cx={x} cy={y} r={7} fill="#6c47ff" />;
      })}
    </Svg>
  );
}
