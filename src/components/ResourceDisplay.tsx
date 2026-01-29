import React from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import { GameScreenProps } from '../types';
import { audio } from '../audio/AudioEngine';

const LOTTIE_FILES = [
  'Cute_Doggie.lottie',
  'Airplane flying.lottie',
  'Airplane.lottie',
  'black rainbow cat.lottie',
  'Car.lottie',
  'Delivery Van.lottie',
  'Happy Dog.lottie',
  'Hear no evil.lottie',
  'Tenor.lottie',
  'yellow taxi.lottie', 
];

const SOUND_MAP: Record<string, string | string[]> = {
  'Cute_Doggie.lottie': 'dog01.mp3',
  'Happy Dog.lottie': 'dog01.mp3',
  'black rainbow cat.lottie': ['cat01.mp3', 'cat02.mp3', 'cat03.mp3'],
  'Car.lottie': 'car-horn.mp3',
  'yellow taxi.lottie': 'car-horn.mp3',
  'Delivery Van.lottie': 'car-horn.mp3',
  // Default fallback?
};

export const ResourceDisplay: React.FC<GameScreenProps> = ({ burst }) => {
  const playSound = (fileName: string) => {
    const soundEntry = SOUND_MAP[fileName];
    if (soundEntry) {
      let soundFile = '';
      if (Array.isArray(soundEntry)) {
        // Pick random
        soundFile = soundEntry[Math.floor(Math.random() * soundEntry.length)];
      } else {
        soundFile = soundEntry;
      }
      audio.playSoundFile(`${import.meta.env.BASE_URL}sounds/${soundFile}`);
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 overflow-x-auto snap-x snap-mandatory flex flex-row scrollbar-hide allow-scroll">
      {LOTTIE_FILES.map((fileName, index) => {
        const lottiePath = `${import.meta.env.BASE_URL}looties/${encodeURIComponent(fileName)}`;
        
        return (
          <div 
            key={fileName}
            className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-8 relative"
            onPointerDown={(e) => {
              // Pointer events unify mouse and touch, preventing double-firing
              burst(e.clientX, e.clientY, '#fbbf24');
              playSound(fileName);
            }}
          >
            <div className="relative w-full max-w-[60vmin] aspect-square bg-white/10 rounded-full shadow-2xl backdrop-blur-sm p-8">
              <DotLottiePlayer
                src={lottiePath}
                autoplay
                loop
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 text-center text-white/30 text-sm font-mono pointer-events-none">
              {index + 1} / {LOTTIE_FILES.length}
            </div>
          </div>
        );
      })}
    </div>
  );
};
