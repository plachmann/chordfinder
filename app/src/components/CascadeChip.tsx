import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

type Props = {
  label: string;
  isNewest: boolean;
  randomMargin: number; // 2-6px, computed by parent
};

export function CascadeChip({ label, isNewest, randomMargin }: Props) {
  const dropAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(isNewest ? 1 : 0)).current;

  useEffect(() => {
    // Drop-in: translateY 30->0, opacity 0->1, scale 0.85->1.0
    Animated.spring(dropAnim, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isNewest) {
      glowAnim.setValue(1);
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: false, // borderColor not supported by native driver
      }).start();
    }
  }, [isNewest]);

  const translateY = dropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });
  const opacity = dropAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 1],
  });
  const scale = dropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(184,148,62,0.30)", colors.accent],
  });

  return (
    <Animated.View
      style={[
        styles.chip,
        {
          marginHorizontal: randomMargin,
          opacity,
          borderColor,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "rgba(40,30,18,0.95)",
    borderWidth: 1,
    borderTopColor: "rgba(210,180,120,0.35)",
    borderBottomColor: "rgba(100,70,30,0.50)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
});
