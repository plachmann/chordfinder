import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { InstrumentPicker } from "../components/InstrumentPicker";
import { useInstrument } from "../hooks/useInstrument";

type Props = { navigation: NativeStackNavigationProp<any> };

export function HomeScreen({ navigation }: Props) {
  const { instrument, setInstrument } = useInstrument();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ChordFinder</Text>
      <Text style={styles.subtitle}>Identify chord progressions in real time</Text>
      <InstrumentPicker selected={instrument} onSelect={setInstrument} />
      <Pressable
        style={styles.listenButton}
        onPress={() => navigation.navigate("Listening", { instrument })}
      >
        <Text style={styles.listenText}>Listen</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f0f",
    padding: 24,
  },
  title: { fontSize: 36, fontWeight: "800", color: "#fff", marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 40,
    textAlign: "center",
  },
  listenButton: {
    marginTop: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#6c47ff",
    alignItems: "center",
    justifyContent: "center",
  },
  listenText: { fontSize: 22, fontWeight: "700", color: "#fff" },
});
