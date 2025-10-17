import { GenerateContentResponse } from "@google/genai";

export enum TranscriptSource {
  USER = 'user',
  MODEL = 'model',
}

export interface TranscriptEntry {
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
  }[];
}