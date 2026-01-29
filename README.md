# Aris Music 🎵

**A "Toddler-First" Musical Educational Game**

Aris Music is a Progressive Web App (PWA) designed specifically for 1-2 year olds. It focuses on intuitive, multi-sensory learning through music, shapes, and colors.

Unlike standard apps, it is built with a "Interaction Lockdown" philosophy:
*   🚫 **No Scrolling or Zooming:** The interface is locked to the viewport to prevent accidental navigation.
*   🎹 **Multi-Touch Support:** Handles "mash" inputs (multiple fingers/palms) gracefully using a custom touch engine.
*   🔊 **Low Latency Audio:** Uses the native Web Audio API for instant sound feedback without heavy library overhead.
*   📱 **Offline Capable:** Installs as a standalone iPad/iOS app and works perfectly without internet.

## Game Modes

### 1. Free Play 🎹
A colorful, full-screen piano interface.
*   **Touch:** Keys light up and play specific notes (C4-C5).
*   **Feedback:** Visual particle bursts and instant audio response.
*   **Goal:** Exploration and cause-and-effect learning.

### 2. Listen & Find 👂
A sound-matching quiz.
*   **Target:** A shape/color appears and plays a sound.
*   **Challenge:** Two options appear at the bottom. The child must match the correct visual to the sound.
*   **Feedback:** "Happy" particle bursts for correct answers; gentle shakes for incorrect ones.

### 3. Resource Display 🖼️
A showcase of animated assets.
*   **Content:** Cycles through a curated list of Lottie animations (animals, vehicles).
*   **Interaction:** Tapping plays associated sounds (e.g., "Woof!", Car Horn) and particle effects.

### 4. Messy Canvas 🎨
A creative musical painting experience.
*   **Visual:** Touch creates shapes (circles, stars, splashes, hearts) that morph colors and pulse.
*   **Audio:** Y-position controls pitch (pentatonic scales), X-position controls mood (left=minor, right=major).
*   **Trails:** Dragging leaves colorful paint trails with sparkle effects.
*   **Ambient:** When you stop touching, the last notes fade into a soft ambient drone.
*   **Filter:** All audio passes through a low-pass filter (2.5kHz) for warm, ear-safe sound.

## Tech Stack

*   **Core:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animation:** HTML5 Canvas (custom particles) + [dotLottie](https://dotlottie.io/)
*   **Audio:** Native Web Audio API (Oscillators & BufferSource)
*   **PWA:** `vite-plugin-pwa` for manifest and service worker generation.

## Development

### Prerequisites
*   Node.js 20+
*   npm

### Quick Start
1.  Clone the repo:
    ```bash
    git clone https://github.com/octopuslabs-fl/arismusic.git
    cd arismusic
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run development server (accessible via local network for device testing):
    ```bash
    npm run host
    ```
    Open the IP address shown (e.g., `http://192.168.1.X:5173`) on your iPad/Device.

### Building for Production
```bash
npm run build
# Preview the production build locally
npm run preview -- --host
```

## Deployment

The project is configured for deployment to **Google Cloud Storage** as a static website.

1.  Ensure you have the `gcloud` CLI installed and authenticated.
2.  Run the deployment script:
    ```bash
    ./deploy.sh
    ```
    *This builds the project and syncs the `dist/` folder to the configured GCS bucket.*

## License

MIT