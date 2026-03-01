import React, { useEffect, useRef } from "react";
import { Animated, Pressable, View, StyleSheet } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
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
      // White-hot filament flash then settle
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.0, tension: 80, friction: 6, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.5, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => startListeningLoop());
      return;
    }

    const config = state === "listening"
      ? { toValue: 1.12, duration: 500, glow: 0.55 }
      : { toValue: 1.04, duration: 1800, glow: 0.25 };

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: config.toValue, duration: config.duration, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: config.glow, duration: config.duration, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.0, duration: config.duration, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: config.glow * 0.4, duration: config.duration, useNativeDriver: true }),
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
          Animated.timing(scale, { toValue: 1.12, duration: 500, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.55, duration: 500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.0, duration: 500, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.22, duration: 500, useNativeDriver: true }),
        ]),
      ])
    );
    loopRef.current = loop;
    loop.start();
  }

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* Warm amber glow behind orb */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Defs>
            <RadialGradient id="tubeGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#ffe0a0" stopOpacity="0.9" />
              <Stop offset="40%" stopColor={colors.accent} stopOpacity="0.7" />
              <Stop offset="70%" stopColor="#8b5a1a" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#1a1410" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="filament" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#fff5e0" stopOpacity="1" />
              <Stop offset="50%" stopColor={colors.accent} stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#6b3a10" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {/* Outer warm haze */}
          <Circle cx={CENTER} cy={CENTER} r={95} fill="url(#tubeGlow)" />
          {/* Glass envelope */}
          <Circle cx={CENTER} cy={CENTER} r={70} fill="rgba(40,28,16,0.6)" stroke={colors.brass} strokeWidth={1.5} strokeOpacity={0.3} />
          {/* Inner tube glow */}
          <Circle cx={CENTER} cy={CENTER} r={50} fill="rgba(212,137,47,0.15)" />
          {/* Filament core */}
          <Circle cx={CENTER} cy={CENTER} r={28} fill="url(#filament)" />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 20,
  },
});
