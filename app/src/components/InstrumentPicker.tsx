import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Instrument } from "../types/api";
import { colors, glass } from "../theme";

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
    ...glass,
    borderRadius: 12,
    padding: 4,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 9,
  },
  activeTab: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: "500" },
  activeLabel: { color: colors.textPrimary, fontWeight: "600" },
});
