import React, { useState, useEffect } from 'react';
import { getMemories, clearMemories } from '../utils/memory';

// Add JSX declarations for standard HTML elements to prevent type errors
// in this project's specific configuration.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      footer: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      ul: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
      li: React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
    }
  }
}

interface MemoryJournalProps {
  onClose: () => void;
}

export const MemoryJournal: React.FC<MemoryJournalProps> = ({ onClose }) => {
  const [memories, setMemories] = useState<string[]>([]);

  useEffect(() => {
    setMemories(getMemories());
  }, []);

  const handleClear = () => {
    clearMemories();
    setMemories([]);
  };

  return (
    <div 
      className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-neutral-900 rounded-lg shadow-xl w-full max-w-md border border-neutral-700 flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <header className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-purple-300">Diario de Recuerdos</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Cerrar diario"
          >
            &times;
          </button>
        </header>
        <div className="p-6 max-h-[60vh] overflow-y-auto flex-grow">
          {memories.length === 0 ? (
            <p className="text-gray-400 text-center italic">Aún no hay recuerdos guardados.</p>
          ) : (
            <ul className="space-y-3 text-gray-300">
              {memories.map((mem, i) => (
                <li key={i} className="pl-2 border-l-2 border-purple-400/50">
                  {mem}
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="p-4 border-t border-neutral-700 flex justify-end flex-shrink-0">
          <button 
            onClick={handleClear} 
            className="bg-red-900 hover:bg-red-800 text-white text-sm py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            disabled={memories.length === 0}
          >
            Olvidar Todo
          </button>
        </footer>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
