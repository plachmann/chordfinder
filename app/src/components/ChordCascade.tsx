import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, ScrollView, Animated, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
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

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
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
