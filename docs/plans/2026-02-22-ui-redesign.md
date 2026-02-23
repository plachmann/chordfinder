# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the ChordFinder app UI with a glassmorphism aesthetic across all three screens, using reusable shared components and a centralized theme.

**Architecture:** Introduce a `theme.ts` token file first, then build shared components (GlassCard, ChordChip, ListenOrb, BottomSheet), then restyle existing components (InstrumentPicker), then rewrite the three screens to use them all. No new npm dependencies — uses existing `react-native-svg` and `react-native` Animated API.

**Tech Stack:** React Native (Expo ~54), TypeScript, react-native-svg 15.x, React Native Animated API

---

## Task 1: Design tokens

**Files:**
- Create: `app/src/theme.ts`

### Step 1: Create the file

```typescript
// app/src/theme.ts
export const colors = {
  background: "#080808",
  surface: "rgba(255,255,255,0.06)",
  surfaceBorder: "rgba(255,255,255,0.10)",
  accent: "#7c5cff",
  accentGlow: "rgba(124,92,255,0.35)",
  accentMid: "rgba(124,92,255,0.15)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.45)",
  errorBg: "rgba(180,30,30,0.85)",
  warningBg: "rgba(120,90,0,0.85)",
};

export const glass = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.surfaceBorder,
  borderRadius: 20,
};

export const shadows = {
  accent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
};
```

### Step 2: Verify TypeScript compiles

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

### Step 3: Commit

```bash
git add app/src/theme.ts
git commit -m "feat: add design token theme file"
```

---

## Task 2: GlassCard component

**Files:**
- Create: `app/src/components/GlassCard.tsx`

### Step 1: Create the component

```typescript
// app/src/components/GlassCard.tsx
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
```

### Step 2: Verify TypeScript compiles

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

### Step 3: Commit

```bash
git add app/src/components/GlassCard.tsx
git commit -m "feat: add GlassCard reusable component"
```

---

## Task 3: ChordChip component

**Files:**
- Create: `app/src/components/ChordChip.tsx`

### Step 1: Create the component

```typescript
// app/src/components/ChordChip.tsx
import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

type Props = {
  label: string;
  onPress?: () => void;
};

export function ChordChip({ label, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(124,92,255,0.4)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pressed: { opacity: 0.85 },
  label: { color: colors.textPrimary, fontSize: 15, fontWeight: "500" },
});
```

### Step 2: Verify TypeScript compiles

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

### Step 3: Commit

```bash
git add app/src/components/ChordChip.tsx
git commit -m "feat: add ChordChip reusable component"
```

---

## Task 4: ListenOrb component

**Files:**
- Create: `app/src/components/ListenOrb.tsx`

The orb is an SVG with three concentric circles. An `Animated.Value` drives scale. State prop changes pulse speed and scale range. On `detected`, a one-shot bloom fires then returns to listening pulse.

### Step 1: Create the component

```typescript
// app/src/components/ListenOrb.tsx
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
    // Blur via shadow — works cross-platform without BlurView
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
});
```

### Step 2: Verify TypeScript compiles

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

### Step 3: Commit

```bash
git add app/src/components/ListenOrb.tsx
git commit -m "feat: add ListenOrb SVG component with idle/listening/detected states"
```

---

## Task 5: Restyle InstrumentPicker

**Files:**
- Modify: `app/src/components/InstrumentPicker.tsx`

### Step 1: Rewrite styles to use theme and GlassCard

```typescript
// app/src/components/InstrumentPicker.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Instrument } from "../types/api";
import { colors, glass } from "../theme";

const INSTRUMENTS: Instrument[] = ["guitar", "banjo", "mandolin", "piano"];

type Props = {
  selected: Instrument;
  onSelect: (instrument: Instrument) => void;
};

export function InstrumentPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {INSTRUMENTS.map((inst) => (
        <Pressable
          key={inst}
          style={[styles.tab, selected === inst && styles.activeTab]}
          onPress={() => onSelect(inst)}
        >
          <Text style={[styles.label, selected === inst && styles.activeLabel]}>
            {inst.charAt(0).toUpperCase() + inst.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    ...glass,
    borderRadius: 12,
    padding: 4,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 9,
  },
  activeTab: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: "500" },
  activeLabel: { color: colors.textPrimary, fontWeight: "600" },
});
```

### Step 2: Verify TypeScript compiles

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

### Step 3: Commit

```bash
git add app/src/components/InstrumentPicker.tsx
git commit -m "feat: restyle InstrumentPicker with glass theme"
```

---

## Task 6: Redesign Home Screen

**Files:**
- Modify: `app/src/screens/HomeScreen.tsx`

Key changes: orb replaces the Listen button. "Try a demo →" replaces Demo button. Purple text glow on title.

### Step 1: Rewrite the screen

```typescript
// app/src/screens/HomeScreen.tsx
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
```

### Step 2: Verify TypeScript compiles

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

### Step 3: Commit

```bash
git add app/src/screens/HomeScreen.tsx
git commit -m "feat: redesign Home Screen with ListenOrb as primary CTA"
```

---

## Task 7: BottomSheet component

**Files:**
- Create: `app/src/components/BottomSheet.tsx`

The bottom sheet handles its own animation and pan responder for swipe-to-dismiss.

### Step 1: Create the component

```typescript
// app/src/components/BottomSheet.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { colors } from "../theme";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;
const DISMISS_THRESHOLD = 80;

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function BottomSheet({ visible, onClose, children }: Props) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SHEET_HEIGHT);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD) {
          Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: "rgba(18,18,24,0.97)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 20,
  },
});
```

### Step 2: Verify TypeScript compiles

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

### Step 3: Commit

```bash
git add app/src/components/BottomSheet.tsx
git commit -m "feat: add BottomSheet component with spring animation and swipe-to-dismiss"
```

---

## Task 8: Redesign Listening Screen

**Files:**
- Modify: `app/src/screens/ListeningScreen.tsx`

Key changes: custom top bar (no nav header), toast banners with auto-dismiss, ListenOrb reacting to session state, animated chord feed, glass stop pill.

**Important:** The orb should enter `detected` state briefly whenever a new chord_update arrives. Track this with a ref + setTimeout to reset back to `listening` after 600ms.

### Step 1: Rewrite the screen

```typescript
// app/src/screens/ListeningScreen.tsx
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
```

### Step 2: Verify TypeScript compiles

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

### Step 3: Commit

```bash
git add app/src/screens/ListeningScreen.tsx
git commit -m "feat: redesign Listening Screen with orb state, animated feed, toast banners"
```

---

## Task 9: Redesign Results Screen

**Files:**
- Modify: `app/src/screens/ResultsScreen.tsx`

Replace Modal with BottomSheet. Use GlassCard for section cards. ChordChip for chord pills. Text link for "New Session".

### Step 1: Rewrite the screen

```typescript
// app/src/screens/ResultsScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { Section, Instrument } from "../types/api";
import { ChordDiagram } from "../components/ChordDiagram";
import { GlassCard } from "../components/GlassCard";
import { ChordChip } from "../components/ChordChip";
import { BottomSheet } from "../components/BottomSheet";
import { colors } from "../theme";

export function ResultsScreen({ route, navigation }: any) {
  const { sections, instrument }: { sections: Section[]; instrument: Instrument } = route.params;
  const [selectedChord, setSelectedChord] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Results</Text>
        <Pressable onPress={() => navigation.navigate("Home")}>
          <Text style={styles.newSession}>New Session</Text>
        </Pressable>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Nothing detected.{"\n"}Try again in a quieter environment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.label}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={styles.sectionLabel}>{item.label}</Text>
              <View style={styles.chordRow}>
                {item.chords.map((chord: string, i: number) => (
                  <ChordChip
                    key={i}
                    label={chord}
                    onPress={() => setSelectedChord(chord)}
                  />
                ))}
              </View>
            </GlassCard>
          )}
        />
      )}

      <BottomSheet
        visible={!!selectedChord}
        onClose={() => setSelectedChord(null)}
      >
        {selectedChord && (
          <>
            <Text style={styles.chordTitle}>{selectedChord}</Text>
            <ChordDiagram chordName={selectedChord} instrument={instrument} />
          </>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  newSession: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  chordRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
  },
  chordTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
  },
});
```

### Step 2: Verify TypeScript compiles

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

### Step 3: Commit

```bash
git add app/src/screens/ResultsScreen.tsx
git commit -m "feat: redesign Results Screen with GlassCard, ChordChip, BottomSheet"
```

---

## Task 10: Final verification

### Step 1: Full TypeScript check

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

### Step 2: Run the app

```bash
cd app && npx expo start
```

Visually verify on iOS and Android simulators:
- Home: orb pulses, tapping navigates to Listening, demo link works, picker shows glass style
- Listening: orb pulses faster when listening, blooms on chord detection, feed animates in, stop pill works
- Results: section cards with glass style, chord chips open bottom sheet, swipe down dismisses

### Step 3: Push branch

```bash
git push -u origin feature/better-ui
```
