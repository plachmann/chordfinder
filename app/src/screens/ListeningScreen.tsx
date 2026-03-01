import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { useListeningSession } from "../hooks/useListeningSession";
import { ListenOrb } from "../components/ListenOrb";
import { ChordCascade } from "../components/ChordCascade";
import { colors } from "../theme";

type OrbState = "idle" | "listening" | "detected";

export function ListeningScreen({ navigation, route }: any) {
  const demo: boolean = route?.params?.demo ?? false;
  const { state, start, startDemo, stop } = useListeningSession();
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
    if (state.status === "no_signal") showBanner("No music detected \u2014 make sure music is playing");
    else if (state.status === "error") showBanner("Connection lost. Reconnecting...");
  }, [state.status]);

  function showBanner(msg: string) {
    setBanner(msg);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 4000);
  }

  const handleStop = async () => {
    await stop();
    navigation.navigate("Results", { sections: state.sections });
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleStop} style={styles.closeButton}>
          <Text style={styles.closeIcon}>\u2715</Text>
        </Pressable>
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

      {/* Chord cascade */}
      <ChordCascade sections={state.sections} />

      {/* Stop button */}
      <Pressable
        style={({ pressed }) => [styles.stopButton, pressed && styles.stopPressed]}
        onPress={handleStop}
      >
        <Text style={styles.stopText}>{"\u25A0"}  Stop & View Results</Text>
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
    borderRadius: 8,
    backgroundColor: "rgba(30,22,14,0.92)",
    borderWidth: 1,
    borderColor: "rgba(184,148,62,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { color: colors.brass, fontSize: 14 },
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(212,137,47,0.90)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bannerText: { color: colors.textPrimary, fontSize: 13, textAlign: "center", fontWeight: "500" },
  orbContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  stopButton: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "rgba(180,50,30,0.85)",
    borderWidth: 1,
    borderColor: "rgba(220,80,40,0.50)",
    borderTopColor: "rgba(240,120,80,0.40)",
    borderBottomColor: "rgba(120,30,15,0.60)",
    alignItems: "center",
    shadowColor: "#b83020",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  stopPressed: {
    backgroundColor: "rgba(150,40,25,0.90)",
  },
  stopText: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
});
