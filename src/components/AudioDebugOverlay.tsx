import React, { useState, useEffect } from 'react';
import { audio } from '../audio/AudioEngine';

interface AudioDebugOverlayProps {
  visible: boolean;
}

export const AudioDebugOverlay: React.FC<AudioDebugOverlayProps> = ({ visible }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [contextState, setContextState] = useState<string>('');

  useEffect(() => {
    if (visible) {
      // Set up debug callback
      audio.setDebugCallback((message) => {
        setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
      });
      
      // Poll context state
      const interval = setInterval(() => {
        setContextState(audio.getState());
      }, 500);
      
      return () => {
        clearInterval(interval);
        audio.setDebugCallback(null);
      };
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-16 left-2 right-2 z-[100] bg-black/90 text-green-400 font-mono text-xs p-3 rounded-lg max-h-[40vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-2 border-b border-green-400/30 pb-2">
        <span className="font-bold">🔊 Audio Debug</span>
        <span className={`px-2 py-1 rounded ${
          contextState === 'running' ? 'bg-green-600' : 
          contextState === 'suspended' ? 'bg-yellow-600' : 'bg-red-600'
        }`}>
          {contextState || 'unknown'}
        </span>
      </div>
      <div className="space-y-1">
        {logs.length === 0 ? (
          <div className="text-green-400/50">Waiting for audio events...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="break-all">{log}</div>
          ))
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-green-400/30 text-green-400/50">
        Triple-tap anywhere to hide
      </div>
    </div>
  );
};
