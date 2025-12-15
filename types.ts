
import { GenerateContentResponse } from "@google/genai";

export enum TranscriptSource {
  USER = 'user',
  MODEL = 'model',
}

export interface TranscriptEntry {
  id: string; // Unique ID for each entry
  source: TranscriptSource;
  text: string;
  isFinal: boolean;
  imageUrl?: string; // For Lily's generated images
  attachment?: { // For user uploads
    dataUrl: string; // The base64 data URL for preview
    name: string;
    type: string;
  };
  searchResults?: { // For Lily's web search results
    uri: string;
    title: string;
    type: 'web' | 'maps';
  }[];
}

export enum MemoryType {
  FACT = 'fact',
  GOAL = 'goal',
  IMAGE = 'image',
}

export interface Memory {
  id: string;
  text: string;
  imageUrl?: string;
  type: MemoryType;
  timestamp: number;
}

// Nueva interfaz para el perfil dinámico
export interface UserProfile {
  userName: string; // "Juan"
  userRelation: string; // "Esposo", "Amigo", "Hijo"
  lilyPersona: string; // "Cariñosa y atenta", "Sarcástica", "Maternal"
  emotionalState: string; // "happy", "sad", "neutral"
  lastInteractionTimestamp: number;
}
