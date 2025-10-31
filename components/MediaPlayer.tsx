
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      iframe: React.DetailedHTMLProps<React.IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>;
      style: React.DetailedHTMLProps<React.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>;
    }
  }
}

interface MediaPlayerProps {
  url: string;
  onClose: () => void;
}

const convertToEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  // Standard `watch?v=` URL
  let videoId = url.split('v=')[1];
  if (videoId) {
    const ampersandPosition = videoId.indexOf('&');
    if (ampersandPosition !== -1) {
      videoId = videoId.substring(0, ampersandPosition);
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }
  // Short `youtu.be/` URL
  videoId = url.split('youtu.be/')[1];
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }
  return null; // Return null if no valid ID is found
};

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ url, onClose }) => {
  const embedUrl = convertToEmbedUrl(url);

  if (!embedUrl) {
    console.error("Invalid YouTube URL provided to MediaPlayer:", url);
    onClose(); // Close the player if the URL is invalid
    return null;
  }

  return (
    <div 
      className="absolute inset-0 bg-black/80 z-40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-neutral-900 rounded-lg shadow-xl w-full max-w-2xl border border-neutral-700 flex flex-col aspect-video relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute -top-3 -right-3 z-50 bg-red-600 text-white rounded-full h-8 w-8 flex items-center justify-center text-lg font-bold hover:bg-red-500 transition-colors"
          aria-label="Cerrar reproductor"
        >
          &times;
        </button>
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        ></iframe>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};
