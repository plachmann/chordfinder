import React, { useEffect, useRef } from "react";
import { Animated, Pressable, View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme";

type OrbState = "idle" | "listening" | "detected";

type Props = {
  state: OrbState;
  onPress?: () => void;
};

const SIZE = 220;
const CENTER = SIZE / 2;

export function ListenOrb({ state, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    loopRef.current?.stop();

    if (state === "detected") {
      // One-shot bloom then resume listening pulse
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.25, duration: 200, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.7, duration: 200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.0, duration: 200, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.5, duration: 200, useNativeDriver: true }),
        ]),
      ]).start(() => startListeningLoop());
      return;
    }

    const config = state === "listening"
      ? { toValue: 1.15, duration: 600, glow: 0.5 }
      : { toValue: 1.05, duration: 1500, glow: 0.3 };

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: config.toValue, duration: config.duration, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: config.glow, duration: config.duration, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.0, duration: config.duration, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: config.glow * 0.5, duration: config.duration, useNativeDriver: true }),
        ]),
      ])
    );
    loopRef.current = loop;
    loop.start();

    return () => loop.stop();
  }, [state]);

  function startListeningLoop() {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.0, duration: 600, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.25, duration: 600, useNativeDriver: true }),
        ]),
      ])
    );
    loopRef.current = loop;
    loop.start();
  }

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* Glow behind orb */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Outer ring */}
          <Circle cx={CENTER} cy={CENTER} r={90} fill="rgba(124,92,255,0.08)" />
          {/* Middle ring */}
          <Circle cx={CENTER} cy={CENTER} r={65} fill="rgba(124,92,255,0.18)" />
          {/* Inner core */}
          <Circle cx={CENTER} cy={CENTER} r={44} fill={colors.accent} />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
});
