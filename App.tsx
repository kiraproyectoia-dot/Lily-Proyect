
import React, { useState, useEffect, useRef } from 'react';
// FIX: Import ThreeElements for use in the global JSX namespace declaration.
// This is necessary to make TypeScript aware of the custom elements used by react-three-fiber.
import type { ThreeElements } from '@react-three/fiber';
import { useLiveSession } from './hooks/useLiveSession';
import { Avatar } from './components/Avatar';
import { Controls } from './components/Controls';
import { StatusIndicator } from './components/StatusIndicator';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { ChatInput } from './components/ChatInput'; 
import { MemoryJournal } from './components/MemoryJournal';
import { WelcomeGuide } from './components/WelcomeGuide';
import { WelcomeBack } from './components/WelcomeBack';
import { LILY_BACKGROUND_MEDIA_URL, TrashIcon } from './constants';
import { MediaPlayer } from './components/MediaPlayer';

// FIX: Consolidated all global JSX intrinsic element definitions into this single, project-wide declaration.
// This resolves conflicts caused by multiple, incomplete declarations across different files.
// It now includes all standard HTML/SVG elements used in the app and extends react-three-fiber's `ThreeElements`
// to support custom elements like `<primitive>`, `<ambientLight>`, etc., in the Avatar component.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      // HTML Elements
      a: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      footer: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      form: React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h4: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      iframe: React.DetailedHTMLProps<React.IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>;
      img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
      li: React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      strong: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      style: React.DetailedHTMLProps<React.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>;
      ul: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
      video: React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
      // SVG Elements
      svg: React.SVGProps<SVGSVGElement>;
      path: React.SVGProps<SVGPathElement>;
      circle: React.SVGProps<SVGCircleElement>;
    }
  }
}

const LILY_AVATAR_URL = 'https://models.readyplayer.me/68e7ada78074ade6a70196db.glb?morphTargets=ARKit,Oculus%20Visemes';

const App: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    isReconnecting,
    isMuted,
    isSpeaking,
    isReplying,
    isPaused,
    currentGesture,
    startSession,
    hardCloseSession,
    togglePause,
    toggleMute,
    error: sessionError,
    transcripts,
    sendTextMessage,
    saveImageMemory,
    clearChatHistory,
    getAudioVolume,
  } = useLiveSession();

  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isMemoryJournalVisible, setIsMemoryJournalVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const lastShownMediaUrl = useRef<string | null>(null);

  // Effect to automatically play media links from Lily's responses
  useEffect(() => {
    if (isChatVisible) {
        const lastTranscript = transcripts[transcripts.length - 1];
        if (lastTranscript && lastTranscript.source === 'model' && lastTranscript.isFinal) {
            const urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            const match = lastTranscript.text.match(urlRegex);
            
            if (match) {
                const url = match[0];
                const isSupported = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('spotify.com') || url.includes('music.apple.com');
                
                if (isSupported && url !== lastShownMediaUrl.current) {
                    setMediaUrl(url);
                    lastShownMediaUrl.current = url;
                }
            }
        }
    }
  }, [transcripts, isChatVisible]);

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

  const isListening = isConnected && !isPaused;

  return (
    <div className="relative text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      {showWelcome && <WelcomeGuide onClose={handleWelcomeClose} />}
      {showWelcomeBack && <WelcomeBack onClose={handleWelcomeBackClose} />}
      
      <div className="relative w-full max-w-5xl h-[95vh] flex flex-col bg-neutral-900/70 rounded-2xl shadow-2xl backdrop-blur-lg border border-neutral-800 overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-neutral-800 flex-shrink-0 z-10">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Lily
          </h1>
          <div className="flex items-center space-x-4">
            <StatusIndicator isConnected={isConnected} isConnecting={isConnecting} isReconnecting={isReconnecting} />
            <Controls
              isConnected={isConnected}
              isConnecting={isConnecting}
              isMuted={isMuted}
              isPaused={isPaused}
              isListening={isListening}
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
              getAudioVolume={getAudioVolume}
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
        {mediaUrl && <MediaPlayer url={mediaUrl} onClose={() => setMediaUrl(null)} />}

        {sessionError && (
            <footer className="p-2 text-center text-sm bg-red-900/50 border-t border-red-700/50">
                <p>{sessionError}</p>
            </footer>
        )}
      </div>
    </div>
  );
};
// FIX: Add default export to make the component available for import in index.tsx.
export default App;
