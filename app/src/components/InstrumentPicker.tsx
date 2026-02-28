import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Instrument } from "../types/api";
import { colors } from "../theme";

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
          {/* Amber indicator light */}
          <View style={[styles.indicator, selected === inst && styles.indicatorActive]} />
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
    backgroundColor: "rgba(30,22,14,0.92)",
    borderWidth: 1,
    borderColor: "rgba(184,148,62,0.20)",
    borderRadius: 10,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 7,
    gap: 4,
  },
  activeTab: {
    backgroundColor: "rgba(212,137,47,0.12)",
    borderWidth: 1,
    borderColor: "rgba(184,148,62,0.30)",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(100,80,40,0.3)",
  },
  indicatorActive: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  label: { color: colors.textSecondary, fontSize: 12, fontWeight: "500" },
  activeLabel: { color: colors.textPrimary, fontWeight: "700" },
});
