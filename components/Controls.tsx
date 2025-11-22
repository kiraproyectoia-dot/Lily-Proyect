
import React from 'react';
import { PowerIcon, MicOnIcon, MicOffIcon, LoadingIcon, ChatIcon, JournalIcon, PauseIcon, PlayIcon, VideoCameraIcon, VideoCameraOffIcon, DesktopComputerIcon, StopScreenShareIcon } from '../constants';

// FIX: Removed the local JSX type declaration. A single, consolidated declaration
// has been moved to the root App.tsx component to resolve project-wide type conflicts.

interface ControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isPaused: boolean;
  isListening: boolean;
  isChatVisible: boolean;
  isMemoryJournalVisible: boolean;
  isCameraActive: boolean;
  isScreenShareActive: boolean;
  hideMainButton?: boolean;
  onStart: () => void;
  onPauseToggle: () => void;
  onMuteToggle: () => void;
  onChatToggle: () => void;
  onMemoryJournalToggle: () => void;
  onCameraToggle: () => void;
  onScreenShareToggle: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isConnected,
  isConnecting,
  isMuted,
  isPaused,
  isListening,
  isChatVisible,
  isMemoryJournalVisible,
  isCameraActive,
  isScreenShareActive,
  hideMainButton = false,
  onStart,
  onPauseToggle,
  onMuteToggle,
  onChatToggle,
  onMemoryJournalToggle,
  onCameraToggle,
  onScreenShareToggle,
}) => {

    const renderMainButton = () => {
        if (!isConnected) {
            return (
                <button
                    onClick={onStart}
                    disabled={isConnecting}
                    className="flex items-center justify-center w-14 h-14 bg-neutral-800 text-white font-semibold rounded-full shadow-lg hover:bg-neutral-700 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 animate-glow ring-1 ring-white/20"
                    aria-label={isConnecting ? "Conectando" : "Iniciar sesión"}
                >
                    {isConnecting ? <LoadingIcon /> : <PowerIcon />}
                </button>
            );
        }

        return (
            <button
              onClick={onPauseToggle}
              className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 ring-1 ring-white/20 ${
                isPaused ? 'bg-green-800 hover:bg-green-700' : 'bg-red-900 hover:bg-red-800'
              } ${isListening ? 'animate-listening-glow' : ''}`}
              aria-label={isPaused ? "Reanudar sesión" : "Pausar sesión"}
            >
              {isPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
        );
    };

    const controlButtonClass = (isActive: boolean) => `w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 shadow-md ring-1 ring-white/10 ${
        isActive
          ? 'bg-neutral-700 hover:bg-neutral-600 text-purple-400'
          : 'bg-neutral-800 hover:bg-neutral-700 text-gray-200'
      }`;

    // Helper for tooltips
    const Tooltip = ({ text }: { text: string }) => (
      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-900 text-gray-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-neutral-700 shadow-xl z-50">
        {text}
        {/* Small arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-700" />
      </div>
    );


  return (
    <div className="flex items-center justify-center gap-3">
      {!isConnected ? (
        renderMainButton()
      ) : (
        <>
          <div className="flex items-center gap-2 bg-neutral-900/50 p-2 rounded-full border border-neutral-800">
              <div className="relative group">
                <button
                    onClick={onChatToggle}
                    className={controlButtonClass(isChatVisible)}
                    aria-label={isChatVisible ? "Ocultar chat" : "Mostrar chat"}
                >
                    <ChatIcon />
                </button>
                <Tooltip text={isChatVisible ? "Ocultar Chat" : "Abrir Chat"} />
              </div>

              <div className="relative group">
                <button
                    onClick={onMemoryJournalToggle}
                    className={controlButtonClass(isMemoryJournalVisible)}
                    aria-label={isMemoryJournalVisible ? "Ocultar diario" : "Mostrar diario"}
                >
                    <JournalIcon />
                </button>
                <Tooltip text="Diario de Recuerdos" />
              </div>
          </div>
          
           {!hideMainButton && renderMainButton()}

          <div className="flex items-center gap-2 bg-neutral-900/50 p-2 rounded-full border border-neutral-800">
              <div className="relative group">
                <button
                    onClick={onCameraToggle}
                    className={controlButtonClass(isCameraActive)}
                    aria-label={isCameraActive ? "Apagar cámara" : "Encender cámara"}
                >
                    {isCameraActive ? <VideoCameraOffIcon /> : <VideoCameraIcon />}
                </button>
                <Tooltip text={isCameraActive ? "Apagar Cámara" : "Activar Cámara"} />
              </div>
              
              <div className="relative group">
                <button
                    onClick={onScreenShareToggle}
                    className={controlButtonClass(isScreenShareActive)}
                    aria-label={isScreenShareActive ? "Dejar de compartir" : "Compartir pantalla"}
                >
                    {isScreenShareActive ? <StopScreenShareIcon /> : <DesktopComputerIcon />}
                </button>
                <Tooltip text={isScreenShareActive ? "Dejar de compartir" : "Compartir Pantalla"} />
              </div>

              <div className="relative group">
                <button
                    onClick={onMuteToggle}
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 shadow-md ring-1 ring-white/10 ${
                    isMuted
                        ? 'bg-amber-600/20 text-amber-500 hover:bg-amber-600/30'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-gray-200'
                    }`}
                    aria-label={isMuted ? "Activar sonido" : "Silenciar sonido"}
                >
                    {isMuted ? <MicOffIcon /> : <MicOnIcon />}
                </button>
                <Tooltip text={isMuted ? "Activar Micrófono" : "Silenciar"} />
              </div>
          </div>
        </>
      )}
    </div>
  );
};
