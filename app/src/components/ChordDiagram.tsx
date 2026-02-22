import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { GuitarDiagram } from "./GuitarDiagram";
import { PianoDiagram } from "./PianoDiagram";
import { Instrument } from "../types/api";

const API_BASE = "http://localhost:8080";

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

  useEffect(() => {
    setLoading(true);
    setVoicing(null);
    fetch(`${API_BASE}/chords/${chordName}`)
      .then((r) => r.json())
      .then((data) => {
        setVoicing(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [chordName]);

  if (loading) return <ActivityIndicator color="#6c47ff" />;
  if (!voicing) return <Text style={styles.unknown}>?</Text>;

  const v = voicing.instruments?.[instrument];
  if (!v) return <Text style={styles.unknown}>?</Text>;

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 8 },
  name: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  unknown: { color: "#888", fontSize: 28 },
});
