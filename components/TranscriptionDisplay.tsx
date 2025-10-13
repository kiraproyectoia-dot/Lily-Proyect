
import React, { useRef, useEffect } from 'react';
import { TranscriptEntry, TranscriptSource } from '../types';

interface TranscriptionDisplayProps {
  transcripts: TranscriptEntry[];
}

const TranscriptBubble: React.FC<{ entry: TranscriptEntry }> = ({ entry }) => {
  const isUser = entry.source === TranscriptSource.USER;
  const bubbleClass = isUser
    ? 'bg-purple-600/80 self-end'
    : 'bg-gray-700/80 self-start';
  const opacityClass = entry.isFinal ? 'opacity-100' : 'opacity-60';

  return (
    <div
      className={`max-w-xs sm:max-w-md md:max-w-lg p-3 rounded-2xl transition-all duration-300 ${bubbleClass} ${opacityClass}`}
    >
      <p className="text-white">{entry.text}</p>
    </div>
  );
};

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ transcripts }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcripts]);

    return (
        <div ref={scrollRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
            {transcripts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Presiona "Iniciar" para comenzar a hablar con Lily.</p>
                </div>
            ) : (
                transcripts.map((entry, index) => (
                    <div key={index} className="flex flex-col">
                        <TranscriptBubble entry={entry} />
                    </div>
                ))
            )}
        </div>
    );
};
