import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/AudioEngine';
// import { useHaptic } from "../context/HapticContext"; // Removed
import { GameScreenProps } from '../types';

const NOTES = [
  { note: 'C4', freq: 261.63, color: 'bg-red-500', activeColor: 'bg-red-300', hex: '#ef4444' },
  { note: 'D4', freq: 293.66, color: 'bg-orange-500', activeColor: 'bg-orange-300', hex: '#f97316' },
  { note: 'E4', freq: 329.63, color: 'bg-yellow-500', activeColor: 'bg-yellow-300', hex: '#eab308' },
  { note: 'F4', freq: 349.23, color: 'bg-green-500', activeColor: 'bg-green-300', hex: '#22c55e' },
  { note: 'G4', freq: 392.00, color: 'bg-teal-500', activeColor: 'bg-teal-300', hex: '#14b8a6' },
  { note: 'A4', freq: 440.00, color: 'bg-blue-500', activeColor: 'bg-blue-300', hex: '#3b82f6' },
  { note: 'B4', freq: 493.88, color: 'bg-indigo-500', activeColor: 'bg-indigo-300', hex: '#6366f1' },
  { note: 'C5', freq: 523.25, color: 'bg-purple-500', activeColor: 'bg-purple-300', hex: '#a855f7' },
];

export const FreePlay: React.FC<GameScreenProps> = ({ touches, burst }) => {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const keyRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // const haptic = useHaptic(); // Removed

  // Audio Resume is now handled by the parent or menu before entering
  
  useEffect(() => {
    const newActiveNotes = new Set<string>();

    touches.forEach(t => {
      keyRefs.current.forEach((div, noteName) => {
        const rect = div.getBoundingClientRect();
        if (
          t.x >= rect.left &&
          t.x <= rect.right &&
          t.y >= rect.top &&
          t.y <= rect.bottom
        ) {
          newActiveNotes.add(noteName);
        }
      });
    });

    // Logic for NEW touches
    newActiveNotes.forEach(note => {
      if (!activeNotes.has(note)) {
        const noteData = NOTES.find(n => n.note === note);
        if (noteData) {
            // 1. Audio
            audio.playTone(noteData.freq, 'sine', 0.5);
            
            // 2. Haptic (Removed)
            // haptic.trigger();

            // 3. Particles (using the prop)
            const div = keyRefs.current.get(note);
            if (div) {
                const rect = div.getBoundingClientRect();
                const triggeringTouch = touches.find(t => 
                    t.x >= rect.left && t.x <= rect.right && 
                    t.y >= rect.top && t.y <= rect.bottom
                );
                
                if (triggeringTouch) {
                    burst(triggeringTouch.x, triggeringTouch.y, noteData.hex);
                }
            }
        }
      }
    });

    setActiveNotes(newActiveNotes);
  }, [touches, burst]); // haptic removed from dependency array

  return (
    <div className="w-full h-full flex flex-row items-stretch">
      {NOTES.map((n) => (
        <div
          key={n.note}
          ref={(el) => {
            if (el) keyRefs.current.set(n.note, el);
            else keyRefs.current.delete(n.note);
          }}
          className={`flex-1 flex items-end justify-center pb-10 transition-colors duration-75 border-r border-black/10 last:border-r-0 ${
            activeNotes.has(n.note) ? n.activeColor : n.color
          }`}
        >
          <span className="text-white font-bold text-2xl opacity-50 pointer-events-none select-none">
            {n.note.replace(/\d/, '')}
          </span>
        </div>
      ))}
    </div>
  );
};
