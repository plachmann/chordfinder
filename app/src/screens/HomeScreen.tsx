import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ListenOrb } from "../components/ListenOrb";
import { colors } from "../theme";

type Props = { navigation: NativeStackNavigationProp<any> };

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ChordFinder</Text>
        <Text style={styles.subtitle}>Identify chord progressions in real time</Text>
      </View>

      <View style={styles.orbArea}>
        <ListenOrb
          state="idle"
          onPress={() => navigation.navigate("Listening")}
        />
        <Pressable
          onPress={() => navigation.navigate("Listening", { demo: true })}
          style={styles.demoLink}
        >
          <Text style={styles.demoText}>Try a demo</Text>
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
    textShadowRadius: 12,
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
  demoLink: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary,
  },
  demoText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
});
