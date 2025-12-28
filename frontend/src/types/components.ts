// Component prop types and interfaces

import type { RecommendationItem } from './recommendations';
import { RecommendationCategory } from './recommendations';
import type { TranslationResult, SupportedLanguage } from './translation';

// SlangTranslator Component Props
export interface SlangTranslatorProps {
  targetLanguage: SupportedLanguage;
  onTranslation: (result: TranslationResult) => void;
  disabled?: boolean;
  placeholder?: string;
}

// VoiceInput Component Props
export interface VoiceInputProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAudioData: (audioBlob: Blob) => void;
  disabled?: boolean;
  className?: string;
}

// RecommendationEngine Component Props
export interface RecommendationEngineProps {
  category: RecommendationCategory | 'all';
  location?: string;
  onRecommendations: (items: RecommendationItem[]) => void;
  loading?: boolean;
}

// RecommendationCard Component Props
export interface RecommendationCardProps {
  item: RecommendationItem;
  onClick?: (item: RecommendationItem) => void;
  showCategory?: boolean;
  compact?: boolean;
}

// LanguageSelector Component Props
export interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  disabled?: boolean;
  variant?: 'dropdown' | 'buttons' | 'tabs';
}

// CategoryFilter Component Props
export interface CategoryFilterProps {
  selectedCategory: RecommendationCategory | 'all';
  onCategoryChange: (category: RecommendationCategory | 'all') => void;
  showCounts?: boolean;
  layout?: 'horizontal' | 'vertical';
}

// SearchBar Component Props
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showVoiceInput?: boolean;
}

// Common UI States
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Audio Recording States
export const RecordingState = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const;

export type RecordingState = typeof RecordingState[keyof typeof RecordingState];

export interface AudioRecordingState {
  state: RecordingState;
  duration?: number;
  error?: string;
}