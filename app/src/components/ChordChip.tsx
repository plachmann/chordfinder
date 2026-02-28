import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

type Props = {
  label: string;
  onPress?: () => void;
};

export function ChordChip({ label, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "rgba(40,30,18,0.95)",
    borderWidth: 1,
    borderColor: "rgba(184,148,62,0.30)",
    borderTopColor: "rgba(210,180,120,0.35)",
    borderBottomColor: "rgba(100,70,30,0.50)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  pressed: {
    borderColor: colors.accent,
    backgroundColor: "rgba(212,137,47,0.12)",
  },
  label: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
});
