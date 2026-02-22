import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
} from "react-native";
import { Section, Instrument } from "../types/api";
import { ChordDiagram } from "../components/ChordDiagram";

export function ResultsScreen({ route, navigation }: any) {
  const { sections, instrument } = route.params;
  const [selectedChord, setSelectedChord] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Results</Text>
      {sections.length === 0 ? (
        <Text style={styles.empty}>No chords detected.</Text>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.label}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>{item.label}</Text>
              <View style={styles.chordRow}>
                {item.chords.map((chord: string, i: number) => (
                  <Pressable
                    key={i}
                    style={styles.chordChip}
                    onPress={() => setSelectedChord(chord)}
                  >
                    <Text style={styles.chordChipText}>{chord}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />
      )}

      <Pressable style={styles.backButton} onPress={() => navigation.navigate("Home")}>
        <Text style={styles.backText}>New Session</Text>
      </Pressable>

      <Modal
        visible={!!selectedChord}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedChord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedChord && (
              <ChordDiagram chordName={selectedChord} instrument={instrument} />
            )}
            <Pressable style={styles.closeButton} onPress={() => setSelectedChord(null)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
  },
  empty: { color: "#666", textAlign: "center", marginTop: 40, fontSize: 16 },
  list: { paddingBottom: 20 },
  sectionCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  sectionLabel: {
    color: "#6c47ff",
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  chordRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chordChip: {
    backgroundColor: "#2a2a2a",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#6c47ff44",
  },
  chordChipText: { color: "#fff", fontSize: 15, fontWeight: "500" },
  backButton: {
    backgroundColor: "#6c47ff",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginVertical: 16,
  },
  backText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000cc",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
  closeText: { color: "#aaa", fontSize: 15 },
});
