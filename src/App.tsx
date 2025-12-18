import { useState, useEffect } from 'react';
import { LockdownManager } from './components/LockdownManager';
import { FreePlay } from './components/FreePlay';
import { ListenAndFind } from './components/ListenAndFind';
import { ResourceDisplay } from './components/ResourceDisplay';
import { GameShell } from './components/GameShell';
import { MainMenu } from './components/MainMenu';
import { audio } from './audio/AudioEngine';
import { ScreenId } from './types';

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('menu');

  const handleInitialStart = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    // The "Golden Interaction" - Everything audio must wake up here
    // We await this to ensure the OS has fully processed the audio resume request
    await audio.unlock();
    
    setIsLoading(false);
    setHasStarted(true);
  };

  // Lifecycle Management for iOS PWA
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background: Assume iOS killed our audio
        setHasStarted(false);
        setIsLoading(false); // Reset loading state
        audio.close();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-slate-900 text-white select-none overflow-hidden touch-none">
      <LockdownManager />
      
      {!hasStarted ? (
        // 1. Initial "Boot" Screen for Audio Unlocking
        <div 
          onClick={handleInitialStart} 
          onTouchStart={handleInitialStart} // Catch touch specifically
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

          
  )
}

export default App
