import React from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { glass, shadows } from "../theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GlassCard({ children, style }: Props) {
  return (
    <View style={[glass, shadows.accent, style]}>
      {children}
    </View>
  );
}
