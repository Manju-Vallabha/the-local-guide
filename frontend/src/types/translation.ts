// Translation-related types and interfaces

export interface TranslationRequest {
  text: string;
  source_language?: string | null;
  target_language: SupportedLanguage;
  context?: string;
}

export interface TranslationResponse {
  original_text: string;
  translated_text: string;
  confidence: number;
  detected_language?: string;
  target_language: string;
  cached: boolean;
  slang_enhanced?: boolean;
  processing_time_ms?: number;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  confidence: number;
  detectedLanguage?: string;
}

export interface SpeechToTextRequest {
  audioFormat: string;
  sampleRate: number;
  languageCode: string;
}

export interface SpeechToTextResponse {
  transcript: string;
  confidence: number;
  processingTime: number;
}

export type SupportedLanguage = 'en' | 'hi' | 'te';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu'
};

export const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  te: 'te-IN'
};