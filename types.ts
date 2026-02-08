export interface BlogPost {
  title: string;
  contentHtml: string;
  suggestedImagePrompts: string[];
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  dataUrl: string; // Base64
  isLoading: boolean;
}

export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT_2_3 = "2:3",
  LANDSCAPE_3_2 = "3:2",
  PORTRAIT_3_4 = "3:4",
  LANDSCAPE_4_3 = "4:3",
  PORTRAIT_9_16 = "9:16",
  LANDSCAPE_16_9 = "16:9",
  CINEMATIC_21_9 = "21:9",
}

export enum ImageSize {
  SIZE_1K = "1K",
  SIZE_2K = "2K",
  SIZE_4K = "4K",
}

export interface GeneratorConfig {
  title: string;
  referenceContent: string;
  tone: string;
  targetAudience: string;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
}

export type ApiProvider = 'gemini' | 'openai' | 'groq';

export interface ApiConfig {
  provider: ApiProvider;
  apiKey: string;
}

// Global declaration for the special AI Studio window object
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}