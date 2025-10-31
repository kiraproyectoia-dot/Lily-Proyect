
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, AttachmentIcon } from '../constants';

// FIX: Manually adding standard HTML element types to the global JSX namespace.
// The project's TypeScript configuration appears to be misconfigured, preventing it from
// automatically recognizing standard JSX intrinsic elements.
declare global {
    namespace JSX {
        interface IntrinsicElements {
            div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
            form: React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
            input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
            button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
            img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
            span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
        }
    }
}

interface ChatInputProps {
    onSendMessage: (payload: { message: string; attachment?: { dataUrl: string; name: string; type: string; } }) => void;
    isReplying: boolean;
}

const placeholders = [
    "Escribe un mensaje o adjunta un archivo...",
    "Puedes pedirle a Lily que dibuje algo...",
    "Prueba a decir: 'Busca las últimas noticias sobre el clima'",
    "¿Sabías que Lily puede cantar? Pídele una canción.",
  ];

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isReplying }) => {
    const [text, setText] = useState('');
    const [attachment, setAttachment] = useState<{ dataUrl: string; name: string; type: string; } | null>(null);
    const [placeholder, setPlaceholder] = useState(placeholders[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isReplying) {
            setPlaceholder("Lily está pensando...");
        } else {
            setPlaceholder(placeholders[0]); // Reset to default when not replying
            const interval = setInterval(() => {
                setPlaceholder(currentPlaceholder => {
                    const currentIndex = placeholders.indexOf(currentPlaceholder);
                    const nextIndex = (currentIndex + 1) % placeholders.length;
                    return placeholders[nextIndex];
                });
            }, 5000); // Change every 5 seconds
            return () => clearInterval(interval);
        }
    }, [isReplying]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setAttachment({
                    dataUrl: loadEvent.target?.result as string,
                    name: file.name,
                    type: file.type,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((text.trim() || attachment) && !isReplying) {
            onSendMessage({ message: text, attachment: attachment || undefined });
            setText('');
            setAttachment(null);
            if(fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();

    return (
        <div className="flex-shrink-0 p-4 border-t border-neutral-800">
            {attachment && (
                <div className="mb-2 flex items-center justify-between bg-neutral-800 p-2 rounded-lg text-sm">
                   <div className="flex items-center gap-2 overflow-hidden">
                     <img src={attachment.dataUrl} alt="preview" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                     <span className="text-gray-300 truncate">{attachment.name}</span>
                   </div>
                   <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-white font-bold text-lg">&times;</button>
                </div>
            )}
            <form onSubmit={handleSubmit} className={isReplying ? 'opacity-50' : ''}>
                <div className="relative flex items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,text/plain,application/pdf"
                    />
                    <button
                        type="button"
                        onClick={triggerFileSelect}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-white hover:bg-neutral-700 transition-colors"
                        disabled={isReplying}
                        aria-label="Adjuntar archivo"
                    >
                        <AttachmentIcon />
                    </button>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-gray-900/50 border border-neutral-700 rounded-full py-2 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                        autoComplete="off"
                        disabled={isReplying}
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        disabled={(!text.trim() && !attachment) || isReplying}
                        aria-label="Enviar mensaje"
                    >
                        <SendIcon />
                    </button>
                </div>
            </form>
        </div>
    );
};
