import React from 'react';
import { PowerIcon, MicOnIcon, MicOffIcon, LoadingIcon, ChatIcon, JournalIcon } from '../constants';

// FIX: Manually adding standard HTML and SVG element types to the global JSX namespace.
// The project's TypeScript configuration appears to be misconfigured, preventing it from
// automatically recognizing standard JSX intrinsic elements. This resolves errors like
// "Property 'className' does not exist on type 'JSX.IntrinsicElements'" by explicitly
// defining types for elements like 'div', 'button', 'svg', and 'path'.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      footer: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      svg: React.SVGProps<SVGSVGElement>;
      path: React.SVGProps<SVGPathElement>;
      form: React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
    }
  }
}

interface ControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isChatVisible: boolean;
  isMemoryJournalVisible: boolean;
  onStart: () => void;
  onStop: () => void;
  onMuteToggle: () => void;
  onChatToggle: () => void;
  onMemoryJournalToggle: () => void;
  onClearChat: () => void; // Prop remains for type safety but is unused
}

export const Controls: React.FC<ControlsProps> = ({
  isConnected,
  isConnecting,
  isMuted,
  isChatVisible,
  isMemoryJournalVisible,
  onStart,
  onStop,
  onMuteToggle,
  onChatToggle,
  onMemoryJournalToggle,
}) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {!isConnected ? (
        <button
          onClick={onStart}
          disabled={isConnecting}
          className="flex items-center justify-center w-12 h-12 bg-neutral-800 text-white font-semibold rounded-full shadow-lg hover:bg-neutral-700 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 animate-glow"
          aria-label={isConnecting ? "Conectando" : "Iniciar sesión"}
        >
          {isConnecting ? (
            <LoadingIcon />
          ) : (
            <PowerIcon />
          )}
        </button>
      ) : (
        <>
          <button
            onClick={onChatToggle}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 ${
              isChatVisible
                ? 'bg-neutral-700 hover:bg-neutral-600'
                : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
            aria-label={isChatVisible ? "Ocultar chat" : "Mostrar chat"}
          >
            <ChatIcon />
          </button>
          <button
            onClick={onMemoryJournalToggle}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 ${
              isMemoryJournalVisible
                ? 'bg-neutral-700 hover:bg-neutral-600'
                : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
            aria-label={isMemoryJournalVisible ? "Ocultar diario" : "Mostrar diario"}
          >
            <JournalIcon />
          </button>
          <button
            onClick={onMuteToggle}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 ${
              isMuted
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
            aria-label={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
          >
            {isMuted ? <MicOffIcon /> : <MicOnIcon />}
          </button>
          <button
            onClick={onStop}
            className="w-12 h-12 flex items-center justify-center bg-red-900 hover:bg-red-800 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-110"
            aria-label="Detener sesión"
          >
            <PowerIcon />
          </button>
        </>
      )}
    </div>
  );
};