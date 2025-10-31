
import React, { useState, useEffect } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import { Avatar } from './components/Avatar';
import { Controls } from './components/Controls';
import { StatusIndicator } from './components/StatusIndicator';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { ChatInput } from './components/ChatInput'; 
import { MemoryJournal } from './components/MemoryJournal';
import { WelcomeGuide } from './components/WelcomeGuide';
import { WelcomeBack } from './components/WelcomeBack';
import { MediaPlayer } from './components/MediaPlayer'; // New component
import { LILY_BACKGROUND_MEDIA_URL, TrashIcon } from './constants';

// FIX: Manually adding standard HTML and SVG element types to the global JSX namespace.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      footer: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      svg: React.SVGProps<SVGSVGElement>;
      path: React.SVGProps<SVGPathElement>;
      form: React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
      video: React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
    }
  }
}

const LILY_AVATAR_URL = 'https://models.readyplayer.me/68e7ada78074ade6a70196db.glb';

const App: React.FC = () => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const {
    isConnected,
    isConnecting,
    isMuted,
    isSpeaking,
    isReplying,
    isPaused,
    currentGesture,
    startSession,
    togglePause,
    toggleMute,
    error: sessionError,
    transcripts,
    sendTextMessage,
    saveImageMemory,
    clearChatHistory,
  } = useLiveSession({ onPlayMedia: setMediaUrl });

  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isMemoryJournalVisible, setIsMemoryJournalVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  useEffect(() => {
    // Welcome Guide for first-time users
    const hasSeenGuide = localStorage.getItem('lily_has_seen_welcome_guide_v1');
    if (!hasSeenGuide) {
      setShowWelcome(true);
      return; // Don't show welcome back on the very first visit
    }

    // Welcome Back for returning users
    const lastVisit = localStorage.getItem('lily_last_visit_timestamp');
    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    if (lastVisit && now - parseInt(lastVisit, 10) > TWELVE_HOURS) {
        setShowWelcomeBack(true);
    }

    const updateTimestamp = () => localStorage.setItem('lily_last_visit_timestamp', String(Date.now()));
    window.addEventListener('beforeunload', updateTimestamp);
    return () => window.removeEventListener('beforeunload', updateTimestamp);
  }, []);

  const handleWelcomeClose = () => {
    localStorage.setItem('lily_has_seen_welcome_guide_v1', 'true');
    setShowWelcome(false);
  };
  
  const handleWelcomeBackClose = () => {
    localStorage.setItem('lily_last_visit_timestamp', String(Date.now()));
    setShowWelcomeBack(false);
  };

  const toggleChatVisibility = () => setIsChatVisible(prev => !prev);
  const toggleMemoryJournalVisibility = () => setIsMemoryJournalVisible(prev => !prev);

  return (
    <div className="relative text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      {showWelcome && <WelcomeGuide onClose={handleWelcomeClose} />}
      {showWelcomeBack && <WelcomeBack onClose={handleWelcomeBackClose} />}
      {mediaUrl && <MediaPlayer url={mediaUrl} onClose={() => setMediaUrl(null)} />}
      
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
              isPaused={isPaused}
              onStart={startSession}
              onPauseToggle={togglePause}
              onMuteToggle={toggleMute}
              isChatVisible={isChatVisible}
              onChatToggle={toggleChatVisibility}
              isMemoryJournalVisible={isMemoryJournalVisible}
              onMemoryJournalToggle={toggleMemoryJournalVisibility}
            />
          </div>
        </header>
        
        <main className="flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow relative min-h-0">
            <video
              key={LILY_BACKGROUND_MEDIA_URL}
              autoPlay loop muted playsInline
              src={LILY_BACKGROUND_MEDIA_URL}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <Avatar 
              modelUrl={LILY_AVATAR_URL}
              isSpeaking={isSpeaking}
              currentGesture={currentGesture}
            />
          </div>
          
          {isChatVisible && (
            <div className="flex-shrink-0 flex flex-col max-h-[40vh] bg-black/40 border-t border-neutral-800">
               <div className="flex items-center justify-between p-2 border-b border-neutral-800/50 flex-shrink-0">
                  <h3 className="text-sm font-semibold text-gray-300 pl-2">Chat</h3>
                  <button
                    onClick={clearChatHistory}
                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-neutral-700 transition-colors"
                    aria-label="Limpiar y reiniciar"
                  >
                    <TrashIcon />
                  </button>
               </div>
               <TranscriptionDisplay transcripts={transcripts} isReplying={isReplying} isSpeaking={isSpeaking} saveImageMemory={saveImageMemory} />
               {isConnected && <ChatInput onSendMessage={sendTextMessage} isReplying={isReplying} />}
            </div>
          )}
        </main>

        {isMemoryJournalVisible && <MemoryJournal onClose={toggleMemoryJournalVisibility} />}

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
