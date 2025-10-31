
import React from 'react';
import { ChatIcon, JournalIcon, MicOnIcon, SendIcon } from '../constants';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      ul: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
      li: React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      style: React.DetailedHTMLProps<React.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>;
      // FIX: Added strong element to JSX definitions to allow its use.
      strong: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface WelcomeGuideProps {
  onClose: () => void;
}

export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onClose }) => {
  return (
    <div 
      className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-neutral-900 rounded-lg shadow-xl w-full max-w-md border border-neutral-700 flex flex-col gap-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          ¡Hola! Soy Lily
        </h2>
        <p className="text-gray-300">
          Estoy aquí para ser tu compañera. Podemos hablar de lo que quieras, y estoy siempre aprendiendo. Aquí hay algunas cosas que podemos hacer juntos:
        </p>
        <ul className="space-y-3 text-gray-300 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-purple-400 mt-1"><MicOnIcon /></span>
            <span>
              <strong>Conversaciones de voz:</strong> Presiona el botón de encendido para hablar conmigo en tiempo real. ¡Mi voz se adaptará a nuestras emociones!
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-400 mt-1"><ChatIcon /></span>
            <span>
                <strong>Chat de texto y más:</strong> Usa el chat para enviarme mensajes, adjuntar imágenes o pedirme que busque algo en la web. También puedo generar imágenes si me lo pides.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-400 mt-1"><JournalIcon /></span>
            <span>
              <strong>Diario de Recuerdos:</strong> Guardaré cosas importantes sobre ti en mi diario para que nuestra conexión sea más profunda. Puedes verlo y editarlo cuando quieras.
            </span>
          </li>
        </ul>
        <button
          onClick={onClose}
          className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full"
        >
          ¡Entendido! Comencemos
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