# PLAN.md - ArisMusic Development Plan

## Phase 1: Foundation & "Toddler-Proofing"
**Goal:** A blank screen that makes sound when touched and cannot be scrolled/zoomed.
- [ ] **Setup:** Initialize React + Vite + TypeScript project.
- [ ] **Manifest:** Configure `manifest.json` for standalone PWA mode (hide browser bars).
- [ ] **Lockdown:** Implement global CSS/JS event listeners to prevent:
    - Scrolling (overscroll-behavior)
    - Zooming (touch-action, meta viewport)
    - Context menus
    - Text selection
- [ ] **Multi-Touch Engine:** Create a hook/manager to track active touch points relative to the screen, supporting simultaneous inputs.

## Phase 2: The Sound Engine
**Goal:** Reliable, low-latency audio synthesis.
- [ ] **Audio Context:** Initialize `AudioContext` (handling the "user gesture" unlock requirement on first touch).
- [ ] **Synthesizer:** Build a simple synth (OscillatorNodes) capable of playing musical notes (C4, D4, E4, etc.).
- [ ] **Mapping:** Map screen coordinates or specific UI regions (keys) to specific frequencies.

## Phase 3: Game Mode 1 - "Free Play"
**Goal:** Aris touches the screen, lights appear, and notes play.
- [ ] **Visuals:** Create a "Keyboard" view (large colorful bars) or "Blob" view (floating circles).
- [ ] **Interaction:** Touching a visual element plays its note and triggers an animation (ripple/glow).
- [ ] **Multi-touch:** Ensure he can mash 3 keys at once and hear a chord.

## Phase 4: Game Mode 2 - "Listen & Find" (Simple Quiz)
**Goal:** The game plays a note, and highlights the target. Aris must touch it.
- [ ] **Game Loop:** Play sound -> Wait for input -> Celebrate correct input.
- [ ] **Hint System:** If he doesn't touch it in 3 seconds, pulse the correct visual visually.

## Tech Stack
-   **Core:** React 19 (via Vite), TypeScript.
-   **Styling:** Tailwind CSS (for rapid layout) + Custom CSS for complex animations.
-   **Audio:** Native `Web Audio API` (Tone.js is an option if raw API gets too complex, but raw is better for understanding).
-   **State:** React `useState` / `useReducer` + `Zustand` (if global state needed).
-   **PWA:** `vite-plugin-pwa` for service worker generation.

## Directory Structure
```
src/
  assets/       # Sounds, Images
  components/   # UI Components (PianoKey, particle effects)
  audio/        # AudioContext logic, Synth definitions
  hooks/        # useMultiTouch, useAudio
  pages/        # Game modes
  styles/       # Global "lockdown" styles
```
