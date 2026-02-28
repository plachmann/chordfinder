# Chord Cascade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic FlatList chord feed on the Listening Screen with a Chord Cascade — individual chips that drop in with spring-bounce physics and organic spacing.

**Architecture:** Two new components (`CascadeChip`, `ChordCascade`) compose the cascade display. `CascadeChip` handles per-chip spring animation and glow pulse. `ChordCascade` handles layout, section dividers, and smart auto-scroll. `ListeningScreen` swaps the old FlatList for `ChordCascade`.

**Tech Stack:** React Native `Animated` API (already used throughout the app), `ScrollView`, existing `colors`/`glass` theme tokens.

**Design doc:** `docs/plans/2026-02-28-chord-cascade-design.md`

---

### Task 1: Create CascadeChip component

**Files:**
- Create: `app/src/components/CascadeChip.tsx`

**Context:**
- Reuses the glass styling from `ChordChip` (`app/src/components/ChordChip.tsx`)
- Uses `colors` from `app/src/theme.ts`
- Uses React Native `Animated` API (same pattern as `ListenOrb.tsx`)

**Step 1: Create `CascadeChip.tsx`**

```tsx
import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

type Props = {
  label: string;
  isNewest: boolean;
  randomMargin: number; // 2-6px, computed by parent
};

export function CascadeChip({ label, isNewest, randomMargin }: Props) {
  const dropAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(isNewest ? 1 : 0)).current;

  useEffect(() => {
    // Drop-in: translateY 30->0, opacity 0->1, scale 0.85->1.0
    Animated.spring(dropAnim, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isNewest) {
      glowAnim.setValue(1);
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: false, // borderColor not supported by native driver
      }).start();
    }
  }, [isNewest]);

  const translateY = dropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });
  const opacity = dropAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 1],
  });
  const scale = dropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(184,148,62,0.30)", colors.accent],
  });

  return (
    <Animated.View
      style={[
        styles.chip,
        {
          marginHorizontal: randomMargin,
          opacity,
          borderColor,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "rgba(40,30,18,0.95)",
    borderWidth: 1,
    borderTopColor: "rgba(210,180,120,0.35)",
    borderBottomColor: "rgba(100,70,30,0.50)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
});
```

**Step 2: Commit**

```bash
git add app/src/components/CascadeChip.tsx
git commit -m "feat: add CascadeChip component with spring drop-in and glow pulse"
```

---

### Task 2: Create ChordCascade component

**Files:**
- Create: `app/src/components/ChordCascade.tsx`

**Context:**
- Imports `CascadeChip` from Task 1
- Imports `Section` type from `app/src/types/api.ts`
- Uses `colors` from `app/src/theme.ts`
- `Section` has `{ label: string; chords: string[] }`

**Step 1: Create `ChordCascade.tsx`**

```tsx
import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, ScrollView, Animated, StyleSheet } from "react-native";
import { CascadeChip } from "./CascadeChip";
import { Section } from "../types/api";
import { colors } from "../theme";

type Props = {
  sections: Section[];
};

function SectionDivider({ label }: { label: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false, // width not supported by native driver
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.dividerContainer}>
      <Animated.View
        style={[
          styles.dividerLine,
          {
            width: widthAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
      <Animated.Text style={[styles.dividerLabel, { opacity: fadeAnim }]}>
        {label}
      </Animated.Text>
    </View>
  );
}

export function ChordCascade({ sections }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const isUserScrolling = useRef(false);
  const prevChordCount = useRef(0);

  // Generate stable random margins per chord (keyed by section+chord index)
  const randomMargins = useMemo(() => {
    const margins: number[] = [];
    for (const section of sections) {
      for (let i = 0; i < section.chords.length; i++) {
        margins.push(2 + Math.random() * 4); // 2-6px
      }
    }
    return margins;
  }, [sections.length]); // Regenerate only when total count changes — appends new values

  // Count total chords to detect new arrivals
  const totalChords = sections.reduce((sum, s) => sum + s.chords.length, 0);
  const isNewChord = totalChords > prevChordCount.current;
  useEffect(() => {
    prevChordCount.current = totalChords;
  }, [totalChords]);

  // Auto-scroll to bottom on new chords
  useEffect(() => {
    if (isNewChord && !isUserScrolling.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [totalChords]);

  const handleScrollBeginDrag = () => {
    isUserScrolling.current = true;
  };

  const handleScrollEndDrag = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isAtBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    if (isAtBottom) {
      isUserScrolling.current = false;
    }
  };

  let chordIndex = 0;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      showsVerticalScrollIndicator={false}
    >
      {sections.map((section, sIdx) => (
        <View key={section.label}>
          {/* Section divider (skip for first section) */}
          {sIdx > 0 && <SectionDivider label={section.label} />}
          {sIdx === 0 && (
            <Animated.Text style={styles.firstSectionLabel}>
              {section.label}
            </Animated.Text>
          )}

          {/* Chord chips */}
          <View style={styles.chordRow}>
            {section.chords.map((chord, cIdx) => {
              const idx = chordIndex++;
              const isLast = sIdx === sections.length - 1 && cIdx === section.chords.length - 1;
              return (
                <CascadeChip
                  key={`${section.label}-${cIdx}`}
                  label={chord}
                  isNewest={isNewChord && isLast}
                  randomMargin={randomMargins[idx] ?? 4}
                />
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 8 },
  chordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  dividerContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "rgba(184,148,62,0.3)",
  },
  dividerLabel: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  firstSectionLabel: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
});
```

**Step 2: Commit**

```bash
git add app/src/components/ChordCascade.tsx
git commit -m "feat: add ChordCascade component with section dividers and auto-scroll"
```

---

### Task 3: Integrate ChordCascade into ListeningScreen

**Files:**
- Modify: `app/src/screens/ListeningScreen.tsx`

**Context:**
- Remove `AnimatedFeedItem` component (lines 19-39)
- Remove `FlatList` import
- Remove `reversedSections` variable (line 81) — cascade shows sections in chronological order
- Replace the `<FlatList>` block (lines 106-114) with `<ChordCascade>`
- Remove unused styles: `feed`, `feedContent`, `feedItem`, `feedLabel`, `feedChords`

**Step 1: Update imports**

Replace:
```tsx
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Animated,
} from "react-native";
```

With:
```tsx
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
```

Add:
```tsx
import { ChordCascade } from "../components/ChordCascade";
```

Remove the `Section` import (no longer used directly).

**Step 2: Remove `AnimatedFeedItem`**

Delete the entire `AnimatedFeedItem` function (lines 19-39).

**Step 3: Remove `reversedSections`**

Delete line 81: `const reversedSections = [...state.sections].reverse();`

**Step 4: Replace FlatList with ChordCascade**

Replace lines 105-114:
```tsx
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
```

With:
```tsx
      {/* Chord cascade */}
      <ChordCascade sections={state.sections} />
```

**Step 5: Remove unused styles**

Delete these style definitions from the `StyleSheet.create` call:
- `feed`
- `feedContent`
- `feedItem`
- `feedLabel`
- `feedChords`

**Step 6: Commit**

```bash
git add app/src/screens/ListeningScreen.tsx
git commit -m "feat: replace chord feed with ChordCascade on Listening Screen"
```

---

### Task 4: Visual verification

**Step 1: Start the app**

```bash
cd app && npx expo start
```

**Step 2: Verify on the Listening Screen**

- Start a demo listening session
- Confirm chord chips drop in with spring bounce animation
- Confirm the newest chip glows amber briefly then fades
- Confirm section dividers appear between sections with animated line
- Confirm chips have slightly varied horizontal spacing (organic feel)
- Confirm auto-scroll follows new chords
- Scroll up manually, confirm auto-scroll pauses
- Scroll back to bottom, confirm auto-scroll resumes

**Step 3: Verify no regressions**

- Confirm the orb still flashes on new chord detection
- Confirm "Stop & View Results" still navigates to Results screen
- Confirm toast banners still appear for no_signal/error states
