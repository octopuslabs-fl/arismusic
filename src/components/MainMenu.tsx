import React from 'react';
import { audio } from '../audio/AudioEngine';
import { ScreenId } from '../types';

interface MainMenuProps {
  onSelectGame: (gameId: ScreenId) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame }) => {
  const handleStart = async (id: ScreenId) => {
    // Critical for iOS: Use the silent buffer unlock trick
    // We MUST await this so the context is fully ready before the game screen mounts.
    await audio.unlock(); 
    onSelectGame(id);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white space-y-8 p-4">
      <h1 className="text-6xl font-bold text-blue-400 mb-8">Aris Music</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Free Play Button */}
        <button
          onClick={() => handleStart('freeplay')}
          className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl shadow-xl transform active:scale-95 transition-all"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎹</div>
          <span className="text-3xl font-bold">Free Play</span>
          <span className="text-white/70 mt-2">Make some noise!</span>
        </button>

        {/* Quiz Button */}
        <button
          onClick={() => handleStart('quiz')}
          className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl shadow-xl transform active:scale-95 transition-all"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">👂</div>
          <span className="text-3xl font-bold">Listen & Find</span>
          <span className="text-white/70 mt-2">Match the sound!</span>
        </button>
        {/* Coming Soon Button */}
        <button
          onClick={() => handleStart('resource-display')}
          className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-xl transform active:scale-95 transition-all"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🖼️</div>
          <span className="text-3xl font-bold">Resource Display</span>
          <span className="text-white/70 mt-2">See an image!</span>
        </button>
      </div>
    </div>
  );
};
