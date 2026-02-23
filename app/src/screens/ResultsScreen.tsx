import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { Section, Instrument } from "../types/api";
import { ChordDiagram } from "../components/ChordDiagram";
import { GlassCard } from "../components/GlassCard";
import { ChordChip } from "../components/ChordChip";
import { BottomSheet } from "../components/BottomSheet";
import { colors } from "../theme";

export function ResultsScreen({ route, navigation }: any) {
  const { sections, instrument }: { sections: Section[]; instrument: Instrument } = route.params;
  const [selectedChord, setSelectedChord] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Results</Text>
        <Pressable onPress={() => navigation.navigate("Home")}>
          <Text style={styles.newSession}>New Session</Text>
        </Pressable>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Nothing detected.{"\n"}Try again in a quieter environment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.label}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={styles.sectionLabel}>{item.label}</Text>
              <View style={styles.chordRow}>
                {item.chords.map((chord: string, i: number) => (
                  <ChordChip
                    key={i}
                    label={chord}
                    onPress={() => setSelectedChord(chord)}
                  />
                ))}
              </View>
            </GlassCard>
          )}
        />
      )}

      <BottomSheet
        visible={!!selectedChord}
        onClose={() => setSelectedChord(null)}
      >
        {selectedChord && (
          <>
            <Text style={styles.chordTitle}>{selectedChord}</Text>
            <ChordDiagram chordName={selectedChord} instrument={instrument} />
          </>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  newSession: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  chordRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
  },
  chordTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
  },
});
