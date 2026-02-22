import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Instrument } from "../types/api";

const INSTRUMENTS: Instrument[] = ["guitar", "banjo", "mandolin", "piano"];

type Props = {
  selected: Instrument;
  onSelect: (instrument: Instrument) => void;
};

export function InstrumentPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {INSTRUMENTS.map((inst) => (
        <Pressable
          key={inst}
          style={[styles.tab, selected === inst && styles.activeTab]}
          onPress={() => onSelect(inst)}
        >
          <Text style={[styles.label, selected === inst && styles.activeLabel]}>
            {inst.charAt(0).toUpperCase() + inst.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: { backgroundColor: "#6c47ff" },
  label: { color: "#888", fontSize: 13, fontWeight: "500" },
  activeLabel: { color: "#fff" },
});
