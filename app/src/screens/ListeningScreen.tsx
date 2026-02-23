import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Animated,
} from "react-native";
import { useListeningSession } from "../hooks/useListeningSession";
import { useInstrument } from "../hooks/useInstrument";
import { InstrumentPicker } from "../components/InstrumentPicker";
import { ListenOrb } from "../components/ListenOrb";
import { colors } from "../theme";
import { Section } from "../types/api";

type OrbState = "idle" | "listening" | "detected";

function AnimatedFeedItem({ item, index }: { item: Section; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, index === 0 ? 1 : 0.5] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <Animated.View style={[styles.feedItem, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.feedLabel}>{item.label}</Text>
      <Text style={styles.feedChords}>{item.chords.join("  →  ")}</Text>
    </Animated.View>
  );
}

export function ListeningScreen({ navigation, route }: any) {
  const demo: boolean = route?.params?.demo ?? false;
  const { state, start, startDemo, stop } = useListeningSession();
  const { instrument, setInstrument } = useInstrument();
  const [orbState, setOrbState] = useState<OrbState>("listening");
  const [banner, setBanner] = useState<string | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSectionCount = useRef(0);

  useEffect(() => {
    demo ? startDemo() : start();
  }, [demo]);

  // Flash orb on new chord detection
  useEffect(() => {
    if (state.sections.length > prevSectionCount.current) {
      prevSectionCount.current = state.sections.length;
      setOrbState("detected");
      const t = setTimeout(() => setOrbState("listening"), 600);
      return () => clearTimeout(t);
    }
  }, [state.sections]);

  // Show toast banners
  useEffect(() => {
    if (state.status === "no_signal") showBanner("No music detected — make sure music is playing");
    else if (state.status === "error") showBanner("Connection lost. Reconnecting...");
  }, [state.status]);

  function showBanner(msg: string) {
    setBanner(msg);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 4000);
  }

  const handleStop = async () => {
    await stop();
    navigation.navigate("Results", { sections: state.sections, instrument });
  };

  const reversedSections = [...state.sections].reverse();

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleStop} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <InstrumentPicker selected={instrument} onSelect={setInstrument} />
      </View>

      {/* Toast banner */}
      {banner && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      )}

      {/* Orb */}
      <View style={styles.orbContainer}>
        <ListenOrb state={orbState} />
      </View>

      {/* Chord feed */}
      <FlatList
        data={reversedSections}
        keyExtractor={(s) => s.label}
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        renderItem={({ item, index }) => (
          <AnimatedFeedItem item={item} index={index} />
        )}
      />

      {/* Stop pill */}
      <Pressable style={styles.stopPill} onPress={handleStop}>
        <Text style={styles.stopText}>■  Stop & View Results</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 56,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { color: colors.textSecondary, fontSize: 14 },
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(120,90,0,0.85)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bannerText: { color: "#ffcc00", fontSize: 13, textAlign: "center" },
  orbContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  feed: { flex: 1 },
  feedContent: { paddingHorizontal: 16, paddingBottom: 8 },
  feedItem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  feedLabel: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  feedChords: { color: colors.textPrimary, fontSize: 16, fontWeight: "500" },
  stopPill: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
  },
  stopText: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
});
