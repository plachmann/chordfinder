import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { GuitarDiagram } from "./GuitarDiagram";
import { PianoDiagram } from "./PianoDiagram";
import { Instrument } from "../types/api";
import { colors } from "../theme";

import { API_BASE } from "../config";

const STRING_COUNTS: Record<Instrument, number> = {
  guitar: 6,
  banjo: 4,
  mandolin: 4,
  piano: 0,
};

interface Props {
  chordName: string;
  instrument: Instrument;
}

export function ChordDiagram({ chordName, instrument }: Props) {
  const [voicing, setVoicing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    setVoicing(null);
    setIndex(0);
    fetch(`${API_BASE}/chords/${chordName}`)
      .then((r) => r.json())
      .then((data) => {
        setVoicing(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [chordName]);

  // Reset index when instrument changes
  useEffect(() => {
    setIndex(0);
  }, [instrument]);

  if (loading) return <ActivityIndicator color={colors.accent} />;
  if (!voicing) return <Text style={styles.unknown}>?</Text>;

  const raw = voicing.instruments?.[instrument];
  if (!raw) return <Text style={styles.unknown}>?</Text>;
  // Handle both array (new API) and single object (old API) formats
  const voicings = Array.isArray(raw) ? raw : [raw];
  if (voicings.length === 0) return <Text style={styles.unknown}>?</Text>;

  const safeIndex = Math.min(index, voicings.length - 1);
  const v = voicings[safeIndex];
  const total = voicings.length;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{voicing.display_name ?? chordName}</Text>
      {instrument === "piano" ? (
        <PianoDiagram keys={v.keys ?? []} />
      ) : (
        <GuitarDiagram
          frets={v.frets ?? []}
          fingers={v.fingers}
          position={v.position ?? 0}
          barre={v.barre}
          stringCount={STRING_COUNTS[instrument]}
        />
      )}
      {total > 1 && (
        <View style={styles.nav}>
          <Pressable
            onPress={() => setIndex((safeIndex - 1 + total) % total)}
            style={styles.arrow}
          >
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Text style={styles.counter}>{safeIndex + 1} of {total}</Text>
          <Pressable
            onPress={() => setIndex((safeIndex + 1) % total)}
            style={styles.arrow}
          >
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 8 },
  name: { color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 8 },
  unknown: { color: colors.textSecondary, fontSize: 28 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 16,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(184,148,62,0.15)",
    borderWidth: 1,
    borderColor: "rgba(184,148,62,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: colors.brass,
    fontSize: 22,
    fontWeight: "600",
    marginTop: -2,
  },
  counter: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
});
