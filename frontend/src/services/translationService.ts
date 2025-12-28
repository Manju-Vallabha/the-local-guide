import axios from 'axios';
import type { TranslationRequest, TranslationResponse, SupportedLanguage } from '../types/translation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for translation
  withCredentials: true,
});

export interface TranslationServiceRequest {
  text: string;
  targetLanguage: SupportedLanguage;
  sourceLanguage?: string;
  context?: string;
}

export interface TranslationServiceResponse {
  originalText: string;
  translatedText: string;
  confidence: number;
  detectedLanguage?: string;
  targetLanguage: string;
  cached: boolean;
  slangEnhanced?: boolean;
  processingTimeMs?: number;
}

export const translationService = {
  /**
   * Translate text using the backend API
   */
  async translateText(request: TranslationServiceRequest): Promise<TranslationServiceResponse> {
    try {
      const payload: TranslationRequest = {
        text: request.text,
        target_language: request.targetLanguage,
        source_language: request.sourceLanguage || null,
        context: request.context || 'varanasi_slang'
      };

      const response = await api.post<TranslationResponse>('/api/translate', payload);
      
      return {
        originalText: response.data.original_text,
        translatedText: response.data.translated_text,
        confidence: response.data.confidence,
        detectedLanguage: response.data.detected_language,
        targetLanguage: response.data.target_language,
        cached: response.data.cached,
        slangEnhanced: response.data.slang_enhanced,
        processingTimeMs: response.data.processing_time_ms
      };
    } catch (error) {
      console.error('Translation API error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 503) {
          throw new Error('Translation service is temporarily unavailable. Please try again later.');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid translation request. Please check your input.');
        } else if (error.response?.status === 403) {
          throw new Error('Translation service access denied. Please check configuration.');
        }
      }
      
      throw new Error('Failed to translate text. Please try again.');
    }
  },

  /**
   * Detect the language of the provided text
   */
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      const formData = new FormData();
      formData.append('text', text);

      const response = await api.post('/api/detect-language', formData);
      
      return {
        language: response.data.detected_language,
        confidence: response.data.confidence
      };
    } catch (error) {
      console.error('Language detection error:', error);
      throw new Error('Failed to detect language');
    }
  },

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<{
    translation: string[];
    speechRecognition: string[];
    recommended: Array<{ code: string; name: string }>;
  }> {
    try {
      const response = await api.get('/api/supported-languages');
      return response.data;
    } catch (error) {
      console.error('Failed to get supported languages:', error);
      // Return fallback supported languages
      return {
        translation: ['en', 'hi', 'te'],
        speechRecognition: ['en-US', 'hi-IN', 'te-IN'],
        recommended: [
          { code: 'en', name: 'English' },
          { code: 'hi', name: 'Hindi' },
          { code: 'te', name: 'Telugu' }
        ]
      };
    }
  }
};