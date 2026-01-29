import React, { useRef, useEffect } from 'react';
import { useMultiTouch } from '../hooks/useMultiTouch';
import { ParticleCanvas, ParticleHandle } from './ParticleCanvas';
import { GameScreenProps } from '../types';
import { audio } from '../audio/AudioEngine';

interface GameShellProps {
  /** The Game Screen component to render */
  screen: React.ComponentType<GameScreenProps>;
  /** Called when the game requests to exit */
  onExit: () => void;
}

export const GameShell: React.FC<GameShellProps> = ({ screen: Screen, onExit }) => {
  const touches = useMultiTouch();
  const particleRef = useRef<ParticleHandle>(null);

  // Ensure audio is active whenever we enter a game screen
  useEffect(() => {
    audio.resume();
    
    // Cleanup on unmount - stop any lingering ambient sounds
    return () => {
      audio.stopAllAmbient();
    };
  }, []);

  const handleBurst = (x: number, y: number, color: string) => {
    particleRef.current?.burst(x, y, color);
  };

  const handleBurstMulticolor = (x: number, y: number) => {
    particleRef.current?.burstMulticolor(x, y);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      {/* 1. Shared Infrastructure Layer */}
      <ParticleCanvas ref={particleRef} />

      {/* 2. Navigation Layer (Always on top) */}
      <button 
        onClick={onExit}
        className="absolute top-4 left-4 z-50 p-2 bg-white/10 rounded-full active:bg-white/30 backdrop-blur-sm transition-colors"
        aria-label="Back to Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* 3. Game Layer */}
      {/* We pass the shared infrastructure down to the specific game */}
      <Screen 
        touches={touches} 
        burst={handleBurst} 
        burstMulticolor={handleBurstMulticolor}
        onExit={onExit} 
      />
    </div>
  );
};
