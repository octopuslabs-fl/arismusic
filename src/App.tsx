import { useState, useEffect, useRef } from 'react';
import { LockdownManager } from './components/LockdownManager';
import { FreePlay } from './components/FreePlay';
import { ListenAndFind } from './components/ListenAndFind';
import { ResourceDisplay } from './components/ResourceDisplay';
import { GameShell } from './components/GameShell';
import { MainMenu } from './components/MainMenu';
import { AudioDebugOverlay } from './components/AudioDebugOverlay';
import { audio } from './audio/AudioEngine';
import { ScreenId } from './types';

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('menu');
  const [showDebug, setShowDebug] = useState(false);
  
  // Triple-tap detection for debug overlay
  const tapTimesRef = useRef<number[]>([]);
  
  const handleTripleTap = () => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    
    // Keep only taps in last 1 second
    tapTimesRef.current = tapTimesRef.current.filter(t => now - t < 1000);
    
    if (tapTimesRef.current.length >= 3) {
      setShowDebug(prev => !prev);
      tapTimesRef.current = [];
    }
  };

  const handleInitialStart = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    // The "Golden Interaction" - unlock audio on user gesture
    // This creates the AudioContext (if needed) and resumes it
    await audio.unlock();
    
    setIsLoading(false);
    setHasStarted(true);
  };

  // Lifecycle Management for iOS PWA
  // KEY CHANGE: We now SUSPEND instead of CLOSE the AudioContext
  // This preserves the context for when the app returns to foreground
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background: SUSPEND audio (don't close!)
        audio.suspend();
        // We don't reset hasStarted - the context is preserved
      } else {
        // App came back to foreground: try to resume
        // Note: This might not work without user gesture, which is fine
        // The next tap will trigger resume anyway
        audio.resume();
      }
    };

    // Also handle the pageshow event for bfcache scenarios
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache
        audio.resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return (
    <div 
      className="w-full h-full min-h-screen flex flex-col bg-slate-900 text-white select-none overflow-hidden touch-none"
      onClick={handleTripleTap}
    >
      <LockdownManager />
      <AudioDebugOverlay visible={showDebug} />
      
      {!hasStarted ? (
        // 1. Initial "Boot" Screen for Audio Unlocking
        <div 
          onClick={handleInitialStart} 
          onTouchStart={handleInitialStart}
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-slate-900"
        >
          <div className={`
             p-12 rounded-full border-4 flex flex-col items-center gap-4
             ${isLoading 
                ? 'bg-green-500/20 border-green-500' 
                : 'bg-blue-500/20 border-blue-500 animate-pulse'
             }
          `}>
            <span className="text-6xl">{isLoading ? '⏳' : '👆'}</span>
            <span className={`text-3xl font-bold ${isLoading ? 'text-green-300' : 'text-blue-300'}`}>
              {isLoading ? 'Starting...' : 'Tap to Start'}
            </span>
          </div>
          <p className="mt-8 text-white/40">Enable Audio</p>
          {showDebug && (
            <p className="mt-2 text-green-400/60 text-sm">Debug mode active</p>
          )}
        </div>
      ) : (
        // 2. Main App Content
        <>
          {currentScreen === 'menu' && (
            <MainMenu onSelectGame={setCurrentScreen} />
          )}

          {currentScreen === 'freeplay' && (
            <GameShell 
              screen={FreePlay} 
              onExit={() => setCurrentScreen('menu')} 
            />
          )}

          {currentScreen === 'quiz' && (
            <GameShell 
              screen={ListenAndFind} 
              onExit={() => setCurrentScreen('menu')} 
            />
          )}

          {currentScreen === 'resource-display' && (
            <GameShell 
              screen={ResourceDisplay} 
              onExit={() => setCurrentScreen('menu')} 
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
