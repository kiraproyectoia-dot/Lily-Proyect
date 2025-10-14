import React from 'react';
import { PowerIcon, MicOnIcon, MicOffIcon, LoadingIcon, ChatIcon } from '../constants';

interface ControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isChatVisible: boolean;
  onStart: () => void;
  onStop: () => void;
  onMuteToggle: () => void;
  onChatToggle: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isConnected,
  isConnecting,
  isMuted,
  isChatVisible,
  onStart,
  onStop,
  onMuteToggle,
  onChatToggle,
}) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {!isConnected ? (
        <button
          onClick={onStart}
          disabled={isConnecting}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          aria-label={isConnecting ? "Conectando" : "Iniciar sesión"}
        >
          {isConnecting ? (
            <LoadingIcon className="animate-spin" />
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
                ? 'bg-purple-600 hover:bg-purple-500'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-label={isChatVisible ? "Ocultar chat" : "Mostrar chat"}
          >
            <ChatIcon />
          </button>
          <button
            onClick={onMuteToggle}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 ${
              isMuted
                ? 'bg-yellow-500 hover:bg-yellow-400'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-label={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
          >
            {isMuted ? <MicOffIcon /> : <MicOnIcon />}
          </button>
          <button
            onClick={onStop}
            className="w-12 h-12 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-110"
            aria-label="Detener sesión"
          >
            <PowerIcon />
          </button>
        </>
      )}
    </div>
  );
};