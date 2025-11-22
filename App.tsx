
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
import { LILY_BACKGROUND_MEDIA_URL, TrashIcon, PlayIcon, PauseIcon, AttachmentIcon } from './constants';
import { MediaPlayer } from './components/MediaPlayer';

// FIX: Consolidated all global JSX intrinsic element definitions into this single, project-wide declaration.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      // R3F elements (explicitly added to fix missing property errors in Avatar.tsx)
      primitive: any;
      ambientLight: any;
      directionalLight: any;

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
      canvas: React.DetailedHTMLProps<React.CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement>;
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
    currentEmotion,
    isCameraActive,
    isScreenShareActive,
    startSession,
    hardCloseSession,
    togglePause,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
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
  
  // Drag and Drop State
  const [isDragActive, setIsDragActive] = useState(false);
  const [droppedFile, setDroppedFile] = useState<{ dataUrl: string; name: string; type: string; } | null>(null);

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
    const hasSeenGuide = localStorage.getItem('lily_has_seen_welcome_guide_v1');
    if (!hasSeenGuide) {
      setShowWelcome(true);
      return; 
    }

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

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragActive) setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            setDroppedFile({
                dataUrl: loadEvent.target?.result as string,
                name: file.name,
                type: file.type,
            });
            setIsChatVisible(true); // Ensure chat is open to see the file
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className="relative text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans"
      onDragOver={handleDragOver}
    >
       {/* Full Screen Drop Overlay */}
       {isDragActive && (
        <div 
            className="absolute inset-0 z-50 bg-purple-900/80 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-purple-400 border-dashed rounded-2xl m-4 pointer-events-none"
            onDragLeave={handleDragLeave}
            onDrop={handleDrop} // The main div handles drop, but this visual helps
        >
             <div className="animate-bounce mb-4 text-purple-200">
                <AttachmentIcon />
             </div>
             <h2 className="text-3xl font-bold text-white">Suéltalo para analizar</h2>
             <p className="text-purple-200 mt-2">PDF, Imágenes o Texto</p>
        </div>
       )}

      {showWelcome && <WelcomeGuide onClose={handleWelcomeClose} />}
      {showWelcomeBack && <WelcomeBack onClose={handleWelcomeBackClose} />}
      
      <div 
        className="relative w-full max-w-5xl h-[95vh] flex flex-col bg-neutral-900/70 rounded-2xl shadow-2xl backdrop-blur-lg border border-neutral-800 overflow-hidden"
        onDrop={handleDrop} // Ensure drop works inside the container too
      >
        <header className="flex items-center justify-between p-4 border-b border-neutral-800 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  Lily
                </h1>
                <StatusIndicator isConnected={isConnected} isConnecting={isConnecting} isReconnecting={isReconnecting} />
              </div>
              {isConnected && (
                <button
                  onClick={togglePause}
                  className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ring-1 ring-white/20 ${
                    isPaused ? 'bg-green-800 hover:bg-green-700' : 'bg-red-900 hover:bg-red-800'
                  } ${isListening ? 'animate-listening-glow' : ''}`}
                  aria-label={isPaused ? "Reanudar sesión" : "Pausar sesión"}
                >
                  {isPaused ? <PlayIcon /> : <PauseIcon />}
                </button>
              )}
          </div>
          <Controls
              isConnected={isConnected}
              isConnecting={isConnecting}
              isMuted={isMuted}
              isPaused={isPaused}
              isListening={isListening}
              isChatVisible={isChatVisible}
              isMemoryJournalVisible={isMemoryJournalVisible}
              isCameraActive={isCameraActive}
              isScreenShareActive={isScreenShareActive}
              hideMainButton={isConnected}
              onStart={startSession}
              onPauseToggle={togglePause}
              onMuteToggle={toggleMute}
              onChatToggle={toggleChatVisibility}
              onMemoryJournalToggle={toggleMemoryJournalVisibility}
              onCameraToggle={toggleCamera}
              onScreenShareToggle={toggleScreenShare}
          />
        </header>
        
        <main className="flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow relative min-h-0">
            <video
              key={LILY_BACKGROUND_MEDIA_URL}
              autoPlay loop muted playsInline
              src={LILY_BACKGROUND_MEDIA_URL}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <Avatar 
              modelUrl={LILY_AVATAR_URL}
              isSpeaking={isSpeaking}
              currentGesture={currentGesture}
              currentEmotion={currentEmotion}
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
               {isConnected && (
                   <ChatInput 
                        onSendMessage={sendTextMessage} 
                        isReplying={isReplying} 
                        externalFile={droppedFile}
                        onExternalFileClear={() => setDroppedFile(null)}
                   />
               )}
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
export default App;
