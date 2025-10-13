import React from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import { useDynamicBackground } from './hooks/useDynamicBackground';
import { Avatar } from './components/Avatar';
import { Controls } from './components/Controls';
import { StatusIndicator } from './components/StatusIndicator';

// The new static and reliable 3D avatar URL for Lily
const LILY_AVATAR_URL = 'https://models.readyplayer.me/68e7ada78074ade6a70196db.glb';

const App: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    isMuted,
    isSpeaking,
    startSession,
    closeSession,
    toggleMute,
    error: sessionError,
  } = useLiveSession();

  const { imageUrl } = useDynamicBackground();

  return (
    <div 
        className="relative text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${imageUrl})`
        }}
    >
      {/* The overlay is now part of the background image style, making it more robust. */}

      {/* Main content appears on top of the background. */}
      <div className="relative w-full max-w-5xl h-[95vh] flex flex-col bg-black/30 rounded-2xl shadow-2xl backdrop-blur-lg border border-white/10 overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
            Lily
          </h1>
          <div className="flex items-center space-x-4">
            <StatusIndicator isConnected={isConnected} isConnecting={isConnecting} />
            <Controls
              isConnected={isConnected}
              isConnecting={isConnecting}
              isMuted={isMuted}
              onStart={startSession}
              onStop={closeSession}
              onMuteToggle={toggleMute}
            />
          </div>
        </header>

        {/* Main content area, avatar takes most space */}
        <main className="flex-grow flex flex-col p-4 sm:p-6 overflow-hidden">
          {/* Avatar takes up all available space */}
          <div className="relative w-full h-full flex-grow rounded-lg overflow-hidden bg-black/20">
            <Avatar 
              modelUrl={LILY_AVATAR_URL}
              isSpeaking={isSpeaking} 
            />
          </div>
        </main>

        {sessionError && (
            <footer className="p-2 text-center bg-red-800/50 text-red-300 text-sm border-t border-white/10 flex-shrink-0">
                Error: {sessionError}
            </footer>
        )}
      </div>
    </div>
  );
};

export default App;