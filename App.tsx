import React, { useState } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import { Avatar } from './components/Avatar';
import { Controls } from './components/Controls';
import { StatusIndicator } from './components/StatusIndicator';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { ChatInput } from './components/ChatInput'; 
import { LILY_BACKGROUND_MEDIA_URL } from './constants';

// The new static and reliable 3D avatar URL for Lily
const LILY_AVATAR_URL = 'https://models.readyplayer.me/68e7ada78074ade6a70196db.glb';

const App: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    isMuted,
    isSpeaking,
    isReplying, // Get the new state
    startSession,
    closeSession,
    toggleMute,
    error: sessionError,
    transcripts,
    sendTextMessage,
  } = useLiveSession();

  const [isChatVisible, setIsChatVisible] = useState(false);

  const toggleChatVisibility = () => setIsChatVisible(prev => !prev);

  return (
    <div 
        className="relative text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-all duration-1000"
    >
      <div className="relative w-full max-w-5xl h-[95vh] flex flex-col bg-neutral-900/70 rounded-2xl shadow-2xl backdrop-blur-lg border border-neutral-800 overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-neutral-800 flex-shrink-0 z-10">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
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
              isChatVisible={isChatVisible}
              onChatToggle={toggleChatVisibility}
            />
          </div>
        </header>

        {/* Main content area split between Avatar and Transcription */}
        <main className="flex flex-col flex-grow overflow-hidden">
          {/* Avatar takes up the remaining flexible space */}
          <div className="flex-grow relative min-h-0">
            <video
              key={LILY_BACKGROUND_MEDIA_URL}
              autoPlay
              loop
              muted
              playsInline
              src={LILY_BACKGROUND_MEDIA_URL}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <Avatar 
              modelUrl={LILY_AVATAR_URL}
              isSpeaking={isSpeaking} 
            />
          </div>
          
          {/* Transcription Display is in a fixed section at the bottom, now conditional */}
          {isChatVisible && (
            <div className="flex-shrink-0 flex flex-col max-h-[35vh] bg-black/40 border-t border-neutral-800">
               <TranscriptionDisplay transcripts={transcripts} />
               {isConnected && <ChatInput onSendMessage={sendTextMessage} isReplying={isReplying} />}
            </div>
          )}
        </main>

        {sessionError && (
            <footer className="p-2 text-center bg-red-800/50 text-red-300 text-sm border-t border-neutral-800 flex-shrink-0 z-10">
                Error: {sessionError}
            </footer>
        )}
      </div>
    </div>
  );
};

export default App;