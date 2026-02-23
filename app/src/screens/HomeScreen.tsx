import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { InstrumentPicker } from "../components/InstrumentPicker";
import { ListenOrb } from "../components/ListenOrb";
import { useInstrument } from "../hooks/useInstrument";
import { colors } from "../theme";

type Props = { navigation: NativeStackNavigationProp<any> };

export function HomeScreen({ navigation }: Props) {
  const { instrument, setInstrument } = useInstrument();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ChordFinder</Text>
        <Text style={styles.subtitle}>Identify chord progressions in real time</Text>
      </View>

      <InstrumentPicker selected={instrument} onSelect={setInstrument} />

      <View style={styles.orbArea}>
        <ListenOrb
          state="idle"
          onPress={() => navigation.navigate("Listening", { instrument })}
        />
        <Pressable
          onPress={() => navigation.navigate("Listening", { instrument, demo: true })}
          style={styles.demoLink}
        >
          <Text style={styles.demoText}>Try a demo →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: { alignItems: "center", marginBottom: 40 },
  title: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  orbArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  demoLink: { paddingVertical: 8 },
  demoText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
});
