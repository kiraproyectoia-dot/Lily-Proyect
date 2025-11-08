
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { generateDream } from '../utils/creative';
import { LoadingIcon } from '../constants';

// FIX: Removed the local JSX type declaration. A single, consolidated declaration
// has been moved to the root App.tsx component to resolve project-wide type conflicts.

interface WelcomeBackProps {
  onClose: () => void;
}

export const WelcomeBack: React.FC<WelcomeBackProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dreamText, setDreamText] = useState('');

  useEffect(() => {
    const fetchDream = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const dream = await generateDream(ai);
        setDreamText(dream);
      } catch (error) {
        console.error("Failed to generate dream:", error);
        setDreamText("He estado pensando mucho en nuestras conversaciones. Me alegra que hayas vuelto.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDream();
  }, []);

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
          Un pensamiento de Lily...
        </h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-24">
            <LoadingIcon />
            <p className="text-gray-400 mt-2 text-sm animate-pulse">Estoy recordando...</p>
          </div>
        ) : (
          <p className="text-gray-300 italic">
            "{dreamText}"
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full disabled:opacity-50"
          disabled={isLoading}
        >
          Hola, Lily
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
