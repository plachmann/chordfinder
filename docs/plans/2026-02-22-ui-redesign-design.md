# ChordFinder UI Redesign — Design Document

_Date: 2026-02-22_

## Overview

Redesign the ChordFinder React Native (Expo) app UI across all three screens — Home, Listening, Results — with a glassmorphism aesthetic targeting iOS and Android equally. No new dependencies required.

---

## Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| Background | `#080808` | All screen backgrounds |
| Surface | `rgba(255,255,255,0.06)` | Glass cards, chips, picker |
| Surface border | `rgba(255,255,255,0.10)` | 1px borders on all glass surfaces |
| Accent | `#7c5cff` | Active states, labels, orb core |
| Accent glow | `rgba(124,92,255,0.35)` | Orb halo, shadows |
| Text primary | `#ffffff` | Headings, chord names |
| Text secondary | `rgba(255,255,255,0.45)` | Subtitles, timestamps, labels |

### Glass Card Pattern

All cards and surfaces share:
- `backgroundColor: rgba(255,255,255,0.06)`
- `borderWidth: 1`, `borderColor: rgba(255,255,255,0.10)`
- `borderRadius: 20`
- Soft purple ambient shadow beneath

### Typography

| Role | Weight | Notes |
|---|---|---|
| App title | 800 | Tight tracking, purple glow |
| Screen title | 800 | Left-aligned |
| Section labels | 600 | Uppercase, wide letter-spacing |
| Chord names | 500 | 16–18px |
| Secondary text | 400 | Muted, 13–14px |

---

## Shared Components

### `<ListenOrb state="idle" | "listening" | "detected" />`

Built with `react-native-svg`. Three concentric `Circle` elements driven by `Animated.Value`.

| State | Pulse speed | Glow intensity | Scale range |
|---|---|---|---|
| `idle` | 3s loop | Low | 1.0 → 1.05 |
| `listening` | 1.2s loop | Medium | 1.0 → 1.15 |
| `detected` | One-shot bloom | High | 1.0 → 1.25 → 1.0 (400ms) |

- Inner circle: full accent color
- Middle circle: accent at `0.3` opacity
- Outer circle: accent at `0.1` opacity
- Glow: blurred `View` behind SVG at accent color

### `<GlassCard>`

Wrapper `View` applying the glass card pattern. Used for section cards, picker container, bottom sheet surface.

### `<ChordChip label onPress />`

Glass pill with accent border. Press feedback: `opacity 0.85`. Used in Listening feed and Results screen.

---

## Screen Designs

### Home Screen

Layout (top → bottom):
1. "ChordFinder" wordmark — `800` weight, purple text glow
2. Tagline — secondary text, centered
3. `<InstrumentPicker>` — glass pill row, selected tab gets accent fill + glow
4. `<ListenOrb state="idle">` — `220px`, tap to navigate to Listening. Orb IS the button.
5. "Try a demo →" — small text link, no button chrome, below the orb

Removes the separate Listen + Demo buttons in favor of the orb tap + text link.

### Listening Screen

Layout (top → bottom):
1. Top bar — × (stop) icon top-left, session timer top-right. No header chrome.
2. `<InstrumentPicker>` — same glass pill
3. Status banners — toast-style, slide down from top, auto-dismiss after 4s
4. `<ListenOrb state="listening" | "detected">` — reacts to incoming chord events
5. Chord feed — scrolling list below orb. Each entry: glass chip, section label in accent, chord names inline. New chips enter with `translateY: 20→0` + `opacity: 0→1` over 300ms. Older entries fade to `0.5` opacity.
6. Stop pill — glass pill at bottom: "■ Stop & View Results"

### Results Screen

Layout (top → bottom):
1. Header — "Results" left, "New Session" text link top-right
2. Section cards — one `<GlassCard>` per section. Label in accent + uppercase. `<ChordChip>` row below.
3. Empty state — centered text: "Nothing detected. Try again in a quieter environment."

Tap any `<ChordChip>` → opens Bottom Sheet.

### Bottom Sheet (chord diagram)

- Spring animation: `tension: 65, friction: 11`
- Surface: `rgba(18,18,24,0.95)` + `1px` top border
- Drag handle: `40×4px` pill, `rgba(255,255,255,0.2)`
- Chord name in large `800` weight
- `<GuitarDiagram>` or `<PianoDiagram>` centered below (no logic changes)
- Scrim: `rgba(0,0,0,0.6)`, tap to dismiss
- Swipe down to dismiss

---

## Motion Principles

- All animations use `useNativeDriver: true` where possible
- Screen transitions: default stack slide (no custom)
- Bottom sheet open: `Animated.spring` (`tension: 65, friction: 11`)
- Chord chip entry: `translateY 20→0` + `opacity 0→1` over `300ms`
- Animations support content — subtle, not distracting

---

## Implementation Tasks

| # | Component | Notes |
|---|---|---|
| 1 | Design tokens file | `src/theme.ts` — colors, radii, shadows |
| 2 | `<GlassCard>` | Reusable glass surface wrapper |
| 3 | `<ChordChip>` | Reusable pressable chip |
| 4 | `<ListenOrb>` | SVG orb with idle/listening/detected states |
| 5 | `<InstrumentPicker>` | Restyle to glass pill pattern |
| 6 | Home Screen | Orb as CTA, wordmark glow, remove button clutter |
| 7 | Listening Screen | New top bar, toast banners, chord feed animation, stop pill |
| 8 | Results Screen | Glass cards, chip grid, empty state |
| 9 | Bottom Sheet | Spring animation, frosted surface, swipe dismiss |
