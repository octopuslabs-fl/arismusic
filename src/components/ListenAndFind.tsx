import { useEffect, useState, useRef, useCallback } from 'react';
import { GameScreenProps } from '../types';
import { audio } from '../audio/AudioEngine';

interface NoteDefinition {
  id: string;
  name: string;
  freq: number;
  color: string;      // Tailwind class for background
  hex: string;        // Hex for particles
  shape: string;      // CSS border-radius value
  shapeName: string; // For accessibility/debugging
}

const NOTES: NoteDefinition[] = [
  { id: 'C4', name: 'C', freq: 261.63, color: 'bg-red-500', hex: '#ef4444', shape: '0%', shapeName: 'Square' },
  { id: 'D4', name: 'D', freq: 293.66, color: 'bg-orange-500', hex: '#f97316', shape: '15%', shapeName: 'Rounded Square' },
  { id: 'E4', name: 'E', freq: 329.63, color: 'bg-yellow-500', hex: '#eab308', shape: '30%', shapeName: 'Squircle' },
  { id: 'F4', name: 'F', freq: 349.23, color: 'bg-green-500', hex: '#22c55e', shape: '50%', shapeName: 'Circle' },
  { id: 'G4', name: 'G', freq: 392.00, color: 'bg-teal-500', hex: '#14b8a6', shape: '50% 50% 0 0', shapeName: 'Dome' },
  { id: 'A4', name: 'A', freq: 440.00, color: 'bg-blue-500', hex: '#3b82f6', shape: '0 0 50% 50%', shapeName: 'Bowl' },
  { id: 'B4', name: 'B', freq: 493.88, color: 'bg-indigo-500', hex: '#6366f1', shape: '20% 0 20% 0', shapeName: 'Leaf' },
  { id: 'C5', name: 'High C', freq: 523.25, color: 'bg-purple-500', hex: '#a855f7', shape: '50% 0 50% 0', shapeName: 'Lemon' },
];

export const ListenAndFind: React.FC<GameScreenProps> = ({ touches, burst, burstMulticolor }) => {
  
  const [targetNote, setTargetNote] = useState<NoteDefinition>(NOTES[0]);
  const [options, setOptions] = useState<NoteDefinition[]>([]);
  const [isWrong, setIsWrong] = useState<string | null>(null); // ID of wrongly touched note
  const [isSuccess, setIsSuccess] = useState(false);

  // --- Game Logic ---

  const generateLevel = useCallback(() => {
    // 1. Pick a random target
    const newTarget = NOTES[Math.floor(Math.random() * NOTES.length)];
    setTargetNote(newTarget);

    // 2. Pick a random distractor (different from target)
    let distractor = NOTES[Math.floor(Math.random() * NOTES.length)];
    while (distractor.id === newTarget.id) {
      distractor = NOTES[Math.floor(Math.random() * NOTES.length)];
    }

    // 3. Shuffle options
    const newOptions = Math.random() > 0.5 
      ? [newTarget, distractor] 
      : [distractor, newTarget];
    
    setOptions(newOptions);
    setIsWrong(null);
    setIsSuccess(false);

    // 4. Play the sound (slight delay to separate from previous level success sound)
    setTimeout(() => {
        audio.playTone(newTarget.freq, 'sine', 0.8);
    }, 300);
  }, []);

  // Initialize first level
  useEffect(() => {
    generateLevel();
  }, [generateLevel]);

  // --- Touch Handling ---

  const processedTouchesRef = useRef<Set<number>>(new Set());
  const optionsRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up processed touches that are no longer active
    const activeIds = new Set(touches.map(t => t.id));
    processedTouchesRef.current.forEach(id => {
      if (!activeIds.has(id)) {
        processedTouchesRef.current.delete(id);
      }
    });

    touches.forEach(t => {
      if (processedTouchesRef.current.has(t.id)) return;
      if (isSuccess) return; // Ignore input during success animation

      let handled = false;

      // 1. Check interaction with Target (Header) - Replay Sound
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        if (t.x >= rect.left && t.x <= rect.right && t.y >= rect.top && t.y <= rect.bottom) {
          audio.playTone(targetNote.freq, 'sine', 0.8);
          // Visual feedback
          burst(t.x, t.y, targetNote.hex);
          handled = true;
        }
      }

      // 2. Check interaction with Options (Bottom)
      optionsRefs.current.forEach((div, noteId) => {
        if (handled) return;
        
        const rect = div.getBoundingClientRect();
        if (t.x >= rect.left && t.x <= rect.right && t.y >= rect.top && t.y <= rect.bottom) {
          const touchedOption = NOTES.find(n => n.id === noteId);
          if (!touchedOption) return;

          audio.playTone(touchedOption.freq, 'sine', 0.8); // Play the note of the touched element (matched volume)
          // Haptic feedback removed as per request

          if (noteId === targetNote.id) {
            // SUCCESS
            setIsSuccess(true);
            // Super burst for positive feedback
            for (let i = 0; i < 5; i++) { // Multiple bursts across screen
                const randomX = Math.random() * window.innerWidth;
                const randomY = Math.random() * window.innerHeight;
                burstMulticolor(randomX, randomY);
            }
            
            // Next level after short delay
            setTimeout(generateLevel, 1500);

          } else {
            // WRONG
            setIsWrong(noteId);
            // Red/black particles for negative feedback
            burst(t.x, t.y, '#ef4444'); // Red
            burst(t.x + 10, t.y + 10, '#000000'); // Black, slightly offset
            
            // Reset wrong state after animation
            setTimeout(() => setIsWrong(null), 500);
          }
          
          handled = true;
        }
      });

      if (handled) {
        processedTouchesRef.current.add(t.id);
      }
    });
  }, [touches, targetNote, burst, isSuccess, generateLevel]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900">
      
      {/* HEADER: Target Note */}
      <div className="flex-[2] flex flex-col items-center justify-center border-b-2 border-white/10 relative">
        <div 
          ref={targetRef}
          className={`
             w-[35vmin] h-[35vmin] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)]
             transition-transform active:scale-95 duration-100 cursor-pointer
             ${targetNote.color}
          `}
          style={{ borderRadius: targetNote.shape }}
        >
          {/* Text hidden for now as per request */}
        </div>
        
        <div className="mt-4 text-white/30 animate-pulse text-[2vmin]">
          (Touch to hear again)
        </div>
      </div>

      {/* BODY: Options */}
      <div className="flex-[3] flex flex-row items-center justify-center gap-[5vmin] p-8 bg-black/20">
        {options.map((opt) => (
          <div
            key={opt.id}
            ref={(el) => {
               if (el) optionsRefs.current.set(opt.id, el);
               else optionsRefs.current.delete(opt.id);
            }}
            className={`
              w-[28vmin] h-[28vmin] flex-shrink-0 transition-all duration-300 transform
              ${isWrong === opt.id ? 'shake grayscale opacity-50' : ''}
              ${isSuccess && opt.id === targetNote.id ? 'scale-125 rotate-12' : ''}
              ${isSuccess && opt.id !== targetNote.id ? 'scale-0 opacity-0' : ''}
              ${opt.color} shadow-2xl
            `}
            style={{ borderRadius: opt.shape }}
          />
        ))}
      </div>
    </div>
  );
};
