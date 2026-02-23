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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(124,92,255,0.4)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pressed: { opacity: 0.85 },
  label: { color: colors.textPrimary, fontSize: 15, fontWeight: "500" },
});
