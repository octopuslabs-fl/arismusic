# GEMINI.md - ArisMusic Project Guidelines

## Core Objective
Build an educational music PWA for Aris (1 year old) to recognize notes, tones, and chords through visual and auditory feedback. The app must be robust enough to handle "toddler usage patterns" (random multi-touch, rapid tapping) without breaking or triggering system gestures.

## Toddler-First Design Principles ("The Aris Standard")

1.  **Interaction Lockdown (Crucial):**
    *   **No System Gestures:** Disable pinch-to-zoom, scroll, and selection globally. The app must feel like a native "kiosk" mode app.
    *   **Multi-Touch Robustness:** The app must handle 5+ simultaneous touches (palm rejection logic or "all touches are valid" depending on the game mode).
    *   **Impossible to Fail:** There are no "Game Overs." Every interaction produces a positive feedback (sound/visual).
    *   **Immediate Feedback:** < 100ms latency between touch and sound is required. Toddlers learn cause-and-effect; delay breaks this connection.

2.  **Visual & Audio Aesthetic:**
    *   **High Contrast & Big Targets:** UI elements must be large (finger-friendly) and clearly distinguishable.
    *   **Calm but Engaging:** Avoid over-stimulation. Clear, pleasant tones (sine/triangle waves or sampled instruments).
    *   **Visual Reinforcement:** A note isn't just a sound; it's a color and a shape. (e.g., C = Red, Circle). Consistently map these.

3.  **Technical Constraints:**
    *   **Offline First:** Must work perfectly without internet (Service Workers).
    *   **PWA Target:** Optimized for iOS Safari (iPad/iPhone) but responsive for desktop mouse usage.
    *   **Audio Engine:** Use `Web Audio API` directly for lowest latency. Avoid heavy audio libraries unless necessary.
    *   **State Management:** React for UI state, but use `useRef` or direct DOM/Canvas access for high-frequency animation loops if needed to avoid React render cycle lag.

## Current Progress (Dec 6, 2025)

### Features Implemented
-   **Architecture:** React + Vite PWA with TypeScript.
-   **Audio:** Custom `AudioEngine` using native Web Audio API. Supports Sine/Triangle/Sawtooth waves and polyphony.
-   **Interaction:**
    -   `useMultiTouch` hook supporting 10+ simultaneous touch points.
    -   `LockdownManager` preventing standard browser gestures (scroll/zoom).
    -   Touch Priority logic to prevent double-firing from mouse emulation on touch devices.
-   **Games:**
    1.  **Free Play:** 8-note colorful piano.
    2.  **Listen & Find:** A matching game where toddlers match a sound/note to a shape/color. (Shapes fixed, text removed, happy/sad feedback implemented).
-   **Visuals:** Custom HTML5 Canvas Particle System (`ParticleCanvas`) with "Multicolor Burst" for success moments.

### Known Issues
-   **iOS PWA Audio "Cold Start" Bug:**
    -   **Symptoms:** On iPad (Add to Home Screen), closing the app and reopening it results in no audio. Tapping "Tap to Start" -> "Free Play" yields silence. However, navigating Back to Menu -> Free Play fixes it.
    -   **Diagnosis Attempts:**
        -   Implemented "Tap to Start" overlay to force user gesture.
        -   Implemented HTML5 Audio Mute Switch Bypass.
        -   Refactored `AudioEngine.unlock()` to destroy and recreate `AudioContext` on every "Unlock" attempt.
        -   Added `await` to `MainMenu` navigation to prevent race conditions.
    -   **Status:** Issue persists. The context creation seems successful, but the audio routing fails on the first deep navigation after a cold start.

## Next Steps

1.  **Debug iOS Audio:**
    -   Investigate if retaining a *single* `AudioContext` (singleton) throughout the app lifecycle is better than destroying/recreating it.
    -   Try creating the context *only* on the first "Tap to Start" and never closing it, just `resume()`ing it.
    -   Add on-screen debug logs to see `AudioContext.state` during the failed flow.

2.  **Refine Game Polish:**
    -   Add more levels or difficulty scaling to "Listen & Find".
    -   Add a "Settings" area (protected by triple-tap) to adjust volume.

3.  **New Modes:**
    -   "Chords Mode": Teaching 2-note combinations.