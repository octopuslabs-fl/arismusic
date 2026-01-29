import React, { useRef, useEffect, useCallback } from 'react';
import { GameScreenProps } from '../types';
import { audio } from '../audio/AudioEngine';

// Musical scales - frequencies in Hz
// Two octaves of each scale for more range
const SCALES = {
  majorPentatonic: [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
  ],
  minorPentatonic: [
    261.63, // C4
    311.13, // Eb4
    349.23, // F4
    392.00, // G4
    466.16, // Bb4
    523.25, // C5
    622.25, // Eb5
    698.46, // F5
    783.99, // G5
    932.33, // Bb5
  ],
};

// Oscillator types for variety
const WAVE_TYPES: OscillatorType[] = ['sine', 'triangle', 'square', 'sawtooth'];

interface Blob {
  id: number;
  x: number;
  y: number;
  baseRadius: number;
  hue: number;
  hueSpeed: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmount: number;
  points: number; // for star shapes
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'star' | 'splash' | 'heart';
  pulsePhase: number;
  pulseSpeed: number;
}

interface Trail {
  x: number;
  y: number;
  radius: number;
  hue: number;
  alpha: number;
}

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number;
  maxLife: number;
  twinklePhase: number;
}

const SHAPES: Blob['shape'][] = ['circle', 'star', 'splash', 'heart'];

export const MessyCanvas: React.FC<GameScreenProps> = ({ touches, burst }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<Blob[]>([]);
  const trailsRef = useRef<Trail[]>([]);
  const sparklesRef = useRef<Sparkle[]>([]);
  const animationRef = useRef<number>(0);
  const idCounterRef = useRef(0);
  const lastTouchRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const backgroundHueRef = useRef(0);
  
  // Music state
  const lastNoteTimeRef = useRef<Map<number, number>>(new Map());
  const currentWaveTypeRef = useRef<OscillatorType>('sine');
  const noteIntervalMs = 80; // Minimum time between notes per finger
  
  // Ambient/sustain state
  const recentNotesRef = useRef<number[]>([]); // Last N frequencies played
  const maxRecentNotes = 4; // Keep track of last 4 unique notes for ambient
  const ambientActiveRef = useRef(false);
  const hadTouchesRef = useRef(false);

  // Play a note based on screen position
  const playNoteAtPosition = useCallback((x: number, y: number, touchId: number) => {
    const now = Date.now();
    const lastTime = lastNoteTimeRef.current.get(touchId) || 0;
    
    // Rate limit notes
    if (now - lastTime < noteIntervalMs) return;
    lastNoteTimeRef.current.set(touchId, now);
    
    // Get screen dimensions
    const height = window.innerHeight;
    const width = window.innerWidth;
    
    // Y position determines pitch (inverted: top = high, bottom = low)
    const normalizedY = 1 - (y / height);
    
    // X position determines scale (left = minor, right = major)
    const normalizedX = x / width;
    const scale = normalizedX > 0.5 ? SCALES.majorPentatonic : SCALES.minorPentatonic;
    
    // Map Y to scale index
    const noteIndex = Math.floor(normalizedY * scale.length);
    const clampedIndex = Math.max(0, Math.min(scale.length - 1, noteIndex));
    let frequency = scale[clampedIndex];
    
    // Occasionally jump an octave for variety (10% chance)
    if (Math.random() < 0.1) {
      frequency *= Math.random() > 0.5 ? 2 : 0.5;
    }
    
    // Slight random detune for organic feel (±10 cents)
    frequency *= Math.pow(2, (Math.random() - 0.5) * 0.02);
    
    // Change wave type occasionally (5% chance)
    if (Math.random() < 0.05) {
      currentWaveTypeRef.current = WAVE_TYPES[Math.floor(Math.random() * WAVE_TYPES.length)];
    }
    
    // Play the note with longer sustain for a warmer sound
    audio.playTone(frequency, currentWaveTypeRef.current, 0.35 + Math.random() * 0.2);
    
    // Track this note for ambient sustain (use base frequency, not detuned)
    const baseFreq = scale[clampedIndex];
    if (!recentNotesRef.current.includes(baseFreq)) {
      recentNotesRef.current.push(baseFreq);
      // Keep only the last N notes
      if (recentNotesRef.current.length > maxRecentNotes) {
        recentNotesRef.current.shift();
      }
    }
  }, []);

  // Start ambient sustain from recent notes
  const startAmbient = useCallback(() => {
    if (ambientActiveRef.current) return;
    if (recentNotesRef.current.length === 0) return;
    
    ambientActiveRef.current = true;
    
    // Create ambient tones from recent notes (lower octave, quiet)
    recentNotesRef.current.forEach((freq, i) => {
      // Stagger the start slightly, use lower octave
      setTimeout(() => {
        // Lower by an octave and vary the volume slightly
        audio.createAmbientTone(freq * 0.5, 'sine', 0.04 + Math.random() * 0.02);
      }, i * 200);
    });
  }, []);

  // Stop ambient sustain
  const stopAmbient = useCallback(() => {
    if (!ambientActiveRef.current) return;
    ambientActiveRef.current = false;
    audio.fadeOutAllAmbient(1.5);
  }, []);

  // Cleanup on unmount - stop all ambient sounds immediately
  useEffect(() => {
    return () => {
      // Kill all ambient immediately on unmount
      audio.stopAllAmbient();
      ambientActiveRef.current = false;
      recentNotesRef.current = [];
    };
  }, []);

  // Create a new blob at touch point
  const createBlob = useCallback((x: number, y: number) => {
    const blob: Blob = {
      id: idCounterRef.current++,
      x,
      y,
      baseRadius: 30 + Math.random() * 50,
      hue: Math.random() * 360,
      hueSpeed: (Math.random() - 0.5) * 2,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      wobbleAmount: 0.2 + Math.random() * 0.3,
      points: 5 + Math.floor(Math.random() * 4),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.05 + Math.random() * 0.05,
    };
    blobsRef.current.push(blob);

    // Keep max 50 blobs
    if (blobsRef.current.length > 50) {
      blobsRef.current.shift();
    }

    // Spawn sparkles
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      sparklesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 8,
        hue: blob.hue + (Math.random() - 0.5) * 60,
        life: 1,
        maxLife: 1,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // Trigger the GameShell particle burst too
    const color = `hsl(${blob.hue}, 80%, 60%)`;
    burst(x, y, color);
  }, [burst]);

  // Add trail point
  const addTrail = useCallback((x: number, y: number, hue: number) => {
    trailsRef.current.push({
      x,
      y,
      radius: 10 + Math.random() * 20,
      hue,
      alpha: 0.6,
    });

    // Keep max 200 trail points
    if (trailsRef.current.length > 200) {
      trailsRef.current.shift();
    }
  }, []);

  // Handle touches
  useEffect(() => {
    const currentTouches = new Set<number>();
    const hasTouches = touches.length > 0;
    
    // Detect transition from no touches to having touches (fade out ambient)
    if (hasTouches && !hadTouchesRef.current) {
      stopAmbient();
    }
    
    // Detect transition from having touches to no touches (start ambient)
    if (!hasTouches && hadTouchesRef.current) {
      // Small delay before starting ambient
      setTimeout(() => {
        if (lastTouchRef.current.size === 0) {
          startAmbient();
        }
      }, 300);
    }
    
    hadTouchesRef.current = hasTouches;
    
    touches.forEach(touch => {
      currentTouches.add(touch.id);
      const lastPos = lastTouchRef.current.get(touch.id);
      
      if (!lastPos) {
        // New touch - create blob and play note
        createBlob(touch.x, touch.y);
        playNoteAtPosition(touch.x, touch.y, touch.id);
      } else {
        // Existing touch - create trail
        const dx = touch.x - lastPos.x;
        const dy = touch.y - lastPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
          const hue = (backgroundHueRef.current + Math.random() * 60) % 360;
          addTrail(touch.x, touch.y, hue);
          
          // Play note while dragging
          playNoteAtPosition(touch.x, touch.y, touch.id);
          
          // Spawn mini sparkles while dragging
          if (Math.random() > 0.5) {
            sparklesRef.current.push({
              x: touch.x,
              y: touch.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4 - 2,
              size: 2 + Math.random() * 4,
              hue,
              life: 0.7,
              maxLife: 0.7,
              twinklePhase: Math.random() * Math.PI * 2,
            });
          }
        }
      }
      
      lastTouchRef.current.set(touch.id, { x: touch.x, y: touch.y });
    });

    // Clean up ended touches
    lastTouchRef.current.forEach((_, id) => {
      if (!currentTouches.has(id)) {
        lastTouchRef.current.delete(id);
        lastNoteTimeRef.current.delete(id); // Clean up note timing too
      }
    });
  }, [touches, createBlob, addTrail, playNoteAtPosition, startAmbient, stopAmbient]);

  // Draw star shape
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    points: number,
    outerR: number,
    innerR: number,
    rotation: number
  ) => {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points + rotation;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  // Draw splash/splat shape
  const drawSplash = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    wobblePhase: number
  ) => {
    ctx.beginPath();
    const points = 12;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const wobble = Math.sin(wobblePhase + i * 1.5) * 0.4 + 1;
      const r = radius * wobble;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  // Draw heart shape
  const drawHeart = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    rotation: number
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size, -size * 0.3, -size * 0.5, -size, 0, -size * 0.5);
    ctx.bezierCurveTo(size * 0.5, -size, size, -size * 0.3, 0, size * 0.3);
    ctx.closePath();
    ctx.restore();
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const loop = () => {
      // Slowly shift background hue
      backgroundHueRef.current = (backgroundHueRef.current + 0.1) % 360;

      // Semi-transparent clear for trail effect
      ctx.fillStyle = `hsla(${backgroundHueRef.current}, 30%, 10%, 0.03)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw trails (fading paint strokes)
      trailsRef.current.forEach((trail, i) => {
        trail.alpha -= 0.002;
        if (trail.alpha <= 0) {
          trailsRef.current.splice(i, 1);
          return;
        }
        ctx.globalAlpha = trail.alpha;
        ctx.fillStyle = `hsl(${trail.hue}, 70%, 50%)`;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw and update blobs
      blobsRef.current.forEach(blob => {
        // Update
        blob.hue = (blob.hue + blob.hueSpeed) % 360;
        if (blob.hue < 0) blob.hue += 360;
        blob.wobblePhase += blob.wobbleSpeed;
        blob.rotation += blob.rotationSpeed;
        blob.pulsePhase += blob.pulseSpeed;

        const pulse = 1 + Math.sin(blob.pulsePhase) * 0.15;
        const wobble = 1 + Math.sin(blob.wobblePhase) * blob.wobbleAmount;
        const radius = blob.baseRadius * pulse * wobble;

        // Draw glow
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, radius * 1.5
        );
        gradient.addColorStop(0, `hsla(${blob.hue}, 80%, 60%, 0.8)`);
        gradient.addColorStop(0.5, `hsla(${blob.hue}, 70%, 50%, 0.4)`);
        gradient.addColorStop(1, `hsla(${blob.hue}, 60%, 40%, 0)`);

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = gradient;

        switch (blob.shape) {
          case 'star':
            drawStar(ctx, blob.x, blob.y, blob.points, radius, radius * 0.5, blob.rotation);
            ctx.fill();
            break;
          case 'splash':
            drawSplash(ctx, blob.x, blob.y, radius, blob.wobblePhase);
            ctx.fill();
            break;
          case 'heart':
            drawHeart(ctx, blob.x, blob.y, radius, blob.rotation);
            ctx.fill();
            break;
          default:
            ctx.beginPath();
            ctx.arc(blob.x, blob.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Inner bright core
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = `hsl(${blob.hue}, 90%, 70%)`;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw and update sparkles
      for (let i = sparklesRef.current.length - 1; i >= 0; i--) {
        const s = sparklesRef.current[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.15; // gravity
        s.life -= 0.015;
        s.twinklePhase += 0.3;

        if (s.life <= 0) {
          sparklesRef.current.splice(i, 1);
          continue;
        }

        const twinkle = 0.5 + Math.sin(s.twinklePhase) * 0.5;
        ctx.globalAlpha = s.life * twinkle;
        ctx.fillStyle = `hsl(${s.hue}, 100%, 75%)`;
        
        // Draw as little star
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.twinklePhase);
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          const angle = (j / 4) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * s.size, Math.sin(angle) * s.size);
        }
        ctx.strokeStyle = `hsl(${s.hue}, 100%, 85%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full touch-none"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    />
  );
};
