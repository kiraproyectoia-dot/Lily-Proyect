import React, { useState } from 'react';
import { SendIcon } from '../constants';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isReplying: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isReplying }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isReplying) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <div className="flex-shrink-0 p-4 border-t border-white/10">
      <form onSubmit={handleSubmit} className={isReplying ? 'opacity-50' : ''}>
        <div className="relative flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isReplying ? "Lily está escribiendo..." : "Escribe un mensaje..."}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-full py-2 pl-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            autoComplete="off"
            disabled={isReplying}
          />
          <button 
            type="submit" 
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            disabled={!text.trim() || isReplying}
            aria-label="Enviar mensaje"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};