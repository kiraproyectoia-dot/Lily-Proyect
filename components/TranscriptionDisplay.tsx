import React, { useRef, useEffect } from 'react';
import { TranscriptEntry, TranscriptSource } from '../types';

interface TranscriptionDisplayProps {
  transcripts: TranscriptEntry[];
}

const TranscriptBubble: React.FC<{ entry: TranscriptEntry }> = ({ entry }) => {
  const isUser = entry.source === TranscriptSource.USER;
  const bubbleClass = isUser
    ? 'bg-neutral-700/90 self-end'
    : 'bg-neutral-800/80 self-start';
  const opacityClass = entry.isFinal ? 'opacity-100' : 'opacity-70';

  return (
    <div
      className={`max-w-xs sm:max-w-md md:max-w-lg p-3 rounded-2xl transition-all duration-300 shadow-md ${bubbleClass} ${opacityClass}`}
    >
      <p className="text-white text-sm sm:text-base">{entry.text}</p>
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
        <div 
          ref={scrollRef} 
          className="flex-grow p-4 space-y-4 overflow-y-auto pr-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent' }}
        >
            {transcripts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400/90">
                    <p className="text-center text-sm">La transcripción del chat aparecerá aquí.</p>
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