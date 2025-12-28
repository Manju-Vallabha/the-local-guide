import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cacheService } from '../services/cacheService';
import axios from 'axios';
import { API_ENDPOINTS } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Translation request/response types
interface TranslationRequest {
  text: string;
  source_language?: string;
  target_language: string;
  context?: string;
}

interface TranslationResponse {
  original_text: string;
  translated_text: string;
  confidence: number;
  detected_language?: string;
  cached: boolean;
}

interface SpeechToTextRequest {
  audio: Blob;
  language_code?: string;
}

interface SpeechToTextResponse {
  transcript: string;
  confidence: number;
  processing_time: number;
}

// Query keys for React Query
export const TRANSLATION_QUERY_KEYS = {
  all: ['translations'] as const,
  translate: (text: string, targetLang: string) => [...TRANSLATION_QUERY_KEYS.all, 'translate', text, targetLang] as const,
  speechToText: (audioHash: string) => [...TRANSLATION_QUERY_KEYS.all, 'speech', audioHash] as const,
} as const;

/**
 * Generate cache key for translation
 */
function generateTranslationCacheKey(text: string, targetLanguage: string, sourceLanguage?: string): string {
  return `${sourceLanguage || 'auto'}-${targetLanguage}-${text.toLowerCase().trim()}`;
}

/**
 * Hook for text translation with caching
 */
export function useTranslation(text: string, targetLanguage: string, sourceLanguage?: string) {
  return useQuery({
    queryKey: TRANSLATION_QUERY_KEYS.translate(text, targetLanguage),
    queryFn: async (): Promise<TranslationResponse> => {
      // Check cache first
      const cacheKey = generateTranslationCacheKey(text, targetLanguage, sourceLanguage);
      const cachedTranslation = cacheService.getCachedTranslation(cacheKey);
      
      if (cachedTranslation) {
        return {
          original_text: text,
          translated_text: cachedTranslation,
          confidence: 1.0,
          detected_language: sourceLanguage,
          cached: true,
        };
      }

      try {
        // Make API request
        const response = await axios.post<TranslationResponse>(
          `${API_BASE_URL}${API_ENDPOINTS.TRANSLATE}`,
          {
            text,
            target_language: targetLanguage,
            source_language: sourceLanguage,
            context: 'varanasi_slang',
          } as TranslationRequest
        );

        // Cache the result
        cacheService.cacheTranslation(cacheKey, response.data.translated_text);

        return { ...response.data, cached: false };
      } catch (error) {
        // If offline and we have any cached translation, return it
        if (!navigator.onLine && cachedTranslation) {
          return {
            original_text: text,
            translated_text: cachedTranslation,
            confidence: 0.8, // Lower confidence for offline cached results
            detected_language: sourceLanguage,
            cached: true,
          };
        }
        throw error;
      }
    },
    enabled: text.length > 0, // Only run if there's text to translate
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: (failureCount) => {
      if (!navigator.onLine) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook for batch translation
 */
export function useBatchTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requests: Array<{ text: string; targetLanguage: string; sourceLanguage?: string }>) => {
      const results: TranslationResponse[] = [];

      for (const request of requests) {
        const cacheKey = generateTranslationCacheKey(request.text, request.targetLanguage, request.sourceLanguage);
        const cachedTranslation = cacheService.getCachedTranslation(cacheKey);

        if (cachedTranslation) {
          results.push({
            original_text: request.text,
            translated_text: cachedTranslation,
            confidence: 1.0,
            detected_language: request.sourceLanguage,
            cached: true,
          });
        } else {
          try {
            const response = await axios.post<TranslationResponse>(
              `${API_BASE_URL}${API_ENDPOINTS.TRANSLATE}`,
              {
                text: request.text,
                target_language: request.targetLanguage,
                source_language: request.sourceLanguage,
                context: 'varanasi_slang',
              } as TranslationRequest
            );

            cacheService.cacheTranslation(cacheKey, response.data.translated_text);
            results.push({ ...response.data, cached: false });
          } catch (error) {
            console.error(`Failed to translate "${request.text}":`, error);
            // Add error result or skip
            results.push({
              original_text: request.text,
              translated_text: request.text, // Fallback to original
              confidence: 0,
              cached: false,
            });
          }
        }
      }

      return results;
    },
    onSuccess: (data) => {
      // Update query cache for individual translations
      data.forEach((result) => {
        queryClient.setQueryData(
          TRANSLATION_QUERY_KEYS.translate(result.original_text, 'auto'), // Simplified key
          result
        );
      });
    },
  });
}

/**
 * Hook for speech-to-text with caching
 */
export function useSpeechToText() {
  return useMutation({
    mutationFn: async ({ audio, language_code = 'en-US' }: SpeechToTextRequest): Promise<SpeechToTextResponse> => {
      const formData = new FormData();
      formData.append('audio', audio);
      formData.append('language_code', language_code);

      const response = await axios.post<SpeechToTextResponse>(
        `${API_BASE_URL}${API_ENDPOINTS.SPEECH_TO_TEXT}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    },
    retry: (failureCount) => {
      if (!navigator.onLine) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook for managing translation cache
 */
export function useTranslationCache() {
  const queryClient = useQueryClient();

  const clearTranslationCache = () => {
    queryClient.removeQueries({
      queryKey: TRANSLATION_QUERY_KEYS.all,
    });
    cacheService.clearCache('local-guide-translations');
  };

  const getCachedTranslations = (): Record<string, string> => {
    return cacheService.getCachedTranslations() || {};
  };

  const preloadCommonTranslations = async (commonPhrases: string[], targetLanguage: string) => {
    const requests = commonPhrases.map(phrase => ({
      text: phrase,
      targetLanguage,
    }));

    // This will cache the translations for offline use
    try {
      const batchMutation = useBatchTranslation();
      await batchMutation.mutateAsync(requests);
    } catch (error) {
      console.warn('Failed to preload common translations:', error);
    }
  };

  return {
    clearTranslationCache,
    getCachedTranslations,
    preloadCommonTranslations,
  };
}