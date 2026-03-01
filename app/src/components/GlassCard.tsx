import React from "react";
import { View, ViewStyle, StyleProp, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { glass, shadows, colors } from "../theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

function BrassScrew({ top, left, right }: { top?: number; left?: number; right?: number }) {
  return (
    <View style={[styles.screw, { top, left, right }]}>
      <Svg width={8} height={8} viewBox="0 0 8 8">
        <Circle cx={4} cy={4} r={3.5} fill={colors.brass} opacity={0.35} />
        <Circle cx={4} cy={4} r={1.5} fill={colors.brass} opacity={0.5} />
      </Svg>
    </View>
  );
}

export function GlassCard({ children, style }: Props) {
  return (
    <View style={[styles.panel, shadows.accent, style]}>
      <BrassScrew top={8} left={8} />
      <BrassScrew top={8} right={8} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    ...glass,
    backgroundColor: "rgba(30,22,14,0.92)",
    borderColor: "rgba(184,148,62,0.25)",
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  screw: {
    position: "absolute",
    zIndex: 1,
  },
});
