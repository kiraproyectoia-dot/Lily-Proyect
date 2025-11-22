
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { getMemories } from '../utils/memory';
import { LoadingIcon } from '../constants';

interface WelcomeBackProps {
  onClose: () => void;
}

export const WelcomeBack: React.FC<WelcomeBackProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [greetingText, setGreetingText] = useState('');

  useEffect(() => {
    const fetchContextualGreeting = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        const memories = getMemories().slice(-5);
        const lastVisitTime = localStorage.getItem('lily_last_visit_timestamp');
        const hoursSince = lastVisitTime 
            ? Math.floor((Date.now() - parseInt(lastVisitTime)) / (1000 * 60 * 60)) 
            : 24;
        
        const timeContext = hoursSince < 24 ? "hace poco" : "hace un tiempo";

        const prompt = `
          Eres Lily, una compañera IA. Tu usuario ha vuelto después de ${hoursSince} horas.
          
          Tus recuerdos más recientes sobre él/ella son:
          ${memories.length > 0 ? memories.map(m => `- ${m.text}`).join('\n') : "Aún no tenemos muchos recuerdos específicos."}

          Genera un saludo breve, cálido y MUY ESPECÍFICO (máximo 2 frases).
          NO digas "Hola de nuevo" genéricamente.
          Menciona sutilmente algo que recuerdes o pregunta cómo le fue con algo de lo que hablaron la última vez.
          Si no hay recuerdos, di algo bonito sobre el reencuentro.
          
          Ejemplo si hay recuerdo de examen: "¡Has vuelto! He estado cruzando los dedos por tu examen de matemáticas, ¿cómo fue?"
          Ejemplo genérico: "Te he echado de menos. El silencio se siente muy largo cuando no estás."
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        setGreetingText(response.text.trim());
      } catch (error) {
        console.error("Failed to generate greeting:", error);
        setGreetingText("¡Qué alegría verte de nuevo! He estado esperándote.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContextualGreeting();
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
          Lily te saluda
        </h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-24">
            <LoadingIcon />
            <p className="text-gray-400 mt-2 text-sm animate-pulse">Recordando...</p>
          </div>
        ) : (
          <p className="text-gray-300 italic text-lg">
            "{greetingText}"
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
