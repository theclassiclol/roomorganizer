export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AnalysisResult {
  text: string;
  timestamp: number;
}

export interface ImageState {
  file: File | null;
  previewUrl: string | null;
  base64: string | null;
}
