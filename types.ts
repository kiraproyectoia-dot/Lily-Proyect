
export enum TranscriptSource {
  USER = 'user',
  MODEL = 'model',
}

export interface TranscriptEntry {
  source: TranscriptSource;
  text: string;
  isFinal: boolean;
}
