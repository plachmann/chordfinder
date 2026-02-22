import React, { useEffect, useRef } from "react";
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

export function ListeningScreen({ navigation, route }: any) {
  const demo: boolean = route?.params?.demo ?? false;
  const { state, start, startDemo, stop } = useListeningSession();
  const { instrument, setInstrument } = useInstrument();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    demo ? startDemo() : start();
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => {
      anim.stop();
      stop();
    };
  }, [demo]);

  const handleStop = async () => {
    await stop();
    navigation.navigate("Results", { sections: state.sections, instrument });
  };

  return (
    <View style={styles.container}>
      <InstrumentPicker selected={instrument} onSelect={setInstrument} />
      {state.status === "no_signal" && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            No music detected — make sure music is playing
          </Text>
        </View>
      )}
      {state.status === "error" && (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerText}>Connection lost. Reconnecting...</Text>
        </View>
      )}
      <Animated.View
        style={[styles.pulseRing, { transform: [{ scale: pulse }] }]}
      />
      <Text style={styles.status}>
        {state.status === "listening" ? "Listening..." : state.status}
      </Text>
      <FlatList
        data={state.sections}
        keyExtractor={(s) => s.label}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>{item.label}</Text>
            <Text style={styles.chords}>{item.chords.join("  →  ")}</Text>
          </View>
        )}
      />
      <Pressable style={styles.stopButton} onPress={handleStop}>
        <Text style={styles.stopText}>Stop</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  banner: {
    backgroundColor: "#4a3a00",
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  bannerError: { backgroundColor: "#4a0000" },
  bannerText: { color: "#ffcc00", fontSize: 13, textAlign: "center" },
  pulseRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6c47ff33",
    alignSelf: "center",
    marginVertical: 20,
  },
  status: { color: "#888", textAlign: "center", marginBottom: 16, fontSize: 14 },
  list: { flex: 1 },
  sectionCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  sectionLabel: {
    color: "#6c47ff",
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  chords: { color: "#fff", fontSize: 16, fontWeight: "500" },
  stopButton: {
    backgroundColor: "#c0392b",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginVertical: 16,
  },
  stopText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
