# Chord Cascade — Listening Screen Redesign

## Problem

The current chord feed on the Listening Screen displays detected chords in a stacked list of rectangular cards. Each card shows a section label and chords joined by arrows. While functional, it feels generic and disconnected from the musical, warm aesthetic of the rest of the app (particularly the ListenOrb).

## Solution: Chord Cascade

Replace the FlatList feed with a **Chord Cascade** — individual chord chips that drop in with spring-physics animation, creating an organic, gravity-driven display.

## Layout

- The cascade occupies the lower ~55% of the screen, below the orb
- Contained in a `ScrollView` that auto-scrolls to bottom as new chords arrive
- Chords render as individual glass-styled chips in a `flexWrap: "wrap"`, `flexDirection: "row"` container
- Each chip has a slight random horizontal margin (2-6px extra), computed once on mount, to break the rigid grid feel
- Chips are uniformly sized
- The most recent chord gets a brighter border glow that fades over ~1 second

### Section Dividers

- Thin horizontal line (1px, `rgba(184,148,62,0.3)`) spanning full width
- Section label (`VERSE 1`, `CHORUS`) as small uppercase text sitting on the line
- Divider line animates width from 0 to 100% over 400ms (ease-out)
- Label fades in simultaneously

### Scroll Behavior

- Auto-scrolls to bottom when new chords arrive
- Auto-scroll pauses when user scrolls up to review earlier chords
- Resumes when user scrolls back to the bottom

## Animations

### Drop-in (new chord detected)

- Chip starts 30px above final position, `opacity: 0`, `scale: 0.85`
- Drops in via `Animated.spring` (tension: 120, friction: 8) — quick bounce
- Opacity fades in over first 200ms
- Scale springs from 0.85 to 1.0

### Glow Pulse (newest chord)

- On arrival, chip border color animates to `colors.accent` at full opacity
- Over 1 second, fades back to normal border (`rgba(184,148,62,0.30)`)
- Driven by `Animated.Value` interpolating border color

### No Exit Animations

- Chords stay where they land
- Older content scrolls off the top naturally

## Repeated Chords

Every chord instance gets its own chip, even if it repeats within the same section (e.g., `Am → G → Am` shows 3 separate chips).

## Component Changes

### New: `ChordCascade` component

- Receives `sections: Section[]` as prop
- Manages scroll behavior (auto-scroll with user override)
- Renders section dividers and chord chips

### New: `CascadeChip` component

- Wraps existing `ChordChip` styling
- Adds drop-in spring animation on mount
- Adds glow pulse animation for "newest" state
- Accepts `isNewest` and `randomMargin` props

### Modified: `ListeningScreen`

- Replace `FlatList` + `AnimatedFeedItem` with `ChordCascade`
- Remove `AnimatedFeedItem` function
- Pass `state.sections` directly to `ChordCascade`

## Files to Change

1. `app/src/components/CascadeChip.tsx` — new component
2. `app/src/components/ChordCascade.tsx` — new component
3. `app/src/screens/ListeningScreen.tsx` — swap feed for cascade
