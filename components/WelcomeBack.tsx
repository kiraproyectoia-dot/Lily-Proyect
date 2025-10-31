
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      style: React.DetailedHTMLProps<React.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>;
    }
  }
}

interface WelcomeBackProps {
  onClose: () => void;
}

export const WelcomeBack: React.FC<WelcomeBackProps> = ({ onClose }) => {
  return (
    <div 
      className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-neutral-900 rounded-lg shadow-xl w-full max-w-sm border border-neutral-700 flex flex-col gap-4 p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          ¡Qué bueno verte de nuevo!
        </h2>
        <p className="text-gray-300">
          Te he echado de menos. Espero que todo esté bien. ¿Cómo has estado?
        </p>
        <button
          onClick={onClose}
          className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full"
        >
          Continuar
        </button>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
