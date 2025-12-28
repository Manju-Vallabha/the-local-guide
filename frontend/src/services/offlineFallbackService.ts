import { cacheService } from './cacheService';
import type { RecommendationItem } from '../types/recommendations';
import type { UserPreferences } from '../types/user';

interface OfflineFallbackData {
  recommendations: RecommendationItem[];
  preferences: UserPreferences | null;
  translations: Record<string, string>;
  essentialData: any;
}

/**
 * Service for providing offline fallback functionality
 */
export class OfflineFallbackService {
  private static instance: OfflineFallbackService;

  static getInstance(): OfflineFallbackService {
    if (!OfflineFallbackService.instance) {
      OfflineFallbackService.instance = new OfflineFallbackService();
    }
    return OfflineFallbackService.instance;
  }

  /**
   * Get all available offline data
   */
  getOfflineData(): OfflineFallbackData {
    return {
      recommendations: cacheService.getCachedRecommendations() || [],
      preferences: cacheService.getCachedUserPreferences(),
      translations: cacheService.getCachedTranslations() || {},
      essentialData: cacheService.getCachedEssentialData(),
    };
  }

  /**
   * Check if specific functionality is available offline
   */
  isAvailableOffline(feature: 'recommendations' | 'preferences' | 'translations' | 'essential'): boolean {
    const data = this.getOfflineData();
    
    switch (feature) {
      case 'recommendations':
        return data.recommendations.length > 0;
      case 'preferences':
        return data.preferences !== null;
      case 'translations':
        return Object.keys(data.translations).length > 0;
      case 'essential':
        return data.essentialData !== null;
      default:
        return false;
    }
  }

  /**
   * Get offline recommendations with fallback filtering
   */
  getOfflineRecommendations(params: {
    category?: string;
    query?: string;
    limit?: number;
  } = {}): RecommendationItem[] {
    const { category = 'all', query, limit = 10 } = params;
    let recommendations = cacheService.getCachedRecommendations() || [];

    // Filter by category if specified
    if (category !== 'all') {
      recommendations = recommendations.filter(item => item.category === category);
    }

    // Filter by search query if specified
    if (query) {
      const searchTerm = query.toLowerCase();
      recommendations = recommendations.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply limit
    return recommendations.slice(0, limit);
  }

  /**
   * Get offline translation with fallback
   */
  getOfflineTranslation(text: string, targetLanguage: string, sourceLanguage?: string): string | null {
    const cacheKey = `${sourceLanguage || 'auto'}-${targetLanguage}-${text.toLowerCase().trim()}`;
    return cacheService.getCachedTranslation(cacheKey);
  }

  /**
   * Get offline user preferences with defaults
   */
  getOfflinePreferences(): UserPreferences | null {
    return cacheService.getCachedUserPreferences();
  }

  /**
   * Provide offline error messages
   */
  getOfflineErrorMessage(feature: string): string {
    const baseMessage = `${feature} is not available offline.`;
    
    if (!this.isAvailableOffline('essential')) {
      return `${baseMessage} Please connect to the internet to use this feature.`;
    }

    switch (feature.toLowerCase()) {
      case 'translation':
        return `${baseMessage} You can still browse cached recommendations and use saved preferences.`;
      case 'recommendations':
        return `${baseMessage} Please connect to the internet to get fresh recommendations.`;
      case 'speech':
        return `${baseMessage} Speech-to-text requires an internet connection.`;
      default:
        return `${baseMessage} Some features require an internet connection.`;
    }
  }

  /**
   * Get offline capabilities summary
   */
  getOfflineCapabilities(): {
    canBrowseRecommendations: boolean;
    canUsePreferences: boolean;
    canTranslate: boolean;
    canUseSpeech: boolean;
    availableCategories: string[];
    availableTranslations: number;
    lastSyncTime: number | null;
  } {
    const data = this.getOfflineData();
    
    // Get available categories from cached recommendations
    const availableCategories = Array.from(
      new Set(data.recommendations.map(item => item.category))
    );

    return {
      canBrowseRecommendations: data.recommendations.length > 0,
      canUsePreferences: data.preferences !== null,
      canTranslate: Object.keys(data.translations).length > 0,
      canUseSpeech: false, // Speech always requires internet
      availableCategories,
      availableTranslations: Object.keys(data.translations).length,
      lastSyncTime: cacheService.getLastSync(),
    };
  }

  /**
   * Provide offline-friendly error handling
   */
  handleOfflineError(error: any, feature: string): {
    canFallback: boolean;
    fallbackData?: any;
    message: string;
  } {
    // Check if we're actually offline
    if (!navigator.onLine) {
      const capabilities = this.getOfflineCapabilities();
      
      switch (feature.toLowerCase()) {
        case 'recommendations':
          return {
            canFallback: capabilities.canBrowseRecommendations,
            fallbackData: this.getOfflineRecommendations(),
            message: capabilities.canBrowseRecommendations
              ? 'Showing cached recommendations (offline mode)'
              : 'No cached recommendations available offline',
          };
          
        case 'preferences':
          return {
            canFallback: capabilities.canUsePreferences,
            fallbackData: this.getOfflinePreferences(),
            message: capabilities.canUsePreferences
              ? 'Using cached preferences (offline mode)'
              : 'No cached preferences available offline',
          };
          
        case 'translation':
          return {
            canFallback: capabilities.canTranslate,
            fallbackData: null, // Translation fallback is handled per-request
            message: capabilities.canTranslate
              ? 'Limited translation available from cache (offline mode)'
              : 'Translation not available offline',
          };
          
        default:
          return {
            canFallback: false,
            message: this.getOfflineErrorMessage(feature),
          };
      }
    }

    // Not an offline error, return original error
    return {
      canFallback: false,
      message: error.message || `${feature} failed`,
    };
  }

  /**
   * Get offline status summary for UI
   */
  getOfflineStatus(): {
    isOffline: boolean;
    hasData: boolean;
    capabilities: string[];
    limitations: string[];
    lastSync: string;
  } {
    const isOffline = !navigator.onLine;
    const capabilities = this.getOfflineCapabilities();
    const lastSync = capabilities.lastSyncTime;
    
    const availableFeatures: string[] = [];
    const limitations: string[] = [];
    
    if (capabilities.canBrowseRecommendations) {
      availableFeatures.push(`Browse ${capabilities.availableCategories.length} categories of recommendations`);
    } else {
      limitations.push('No cached recommendations');
    }
    
    if (capabilities.canUsePreferences) {
      availableFeatures.push('Access saved preferences');
    } else {
      limitations.push('No saved preferences');
    }
    
    if (capabilities.canTranslate) {
      availableFeatures.push(`${capabilities.availableTranslations} cached translations`);
    } else {
      limitations.push('No cached translations');
    }
    
    // Always add speech limitation when offline
    if (isOffline) {
      limitations.push('Speech-to-text unavailable');
      limitations.push('Fresh data updates unavailable');
    }

    return {
      isOffline,
      hasData: availableFeatures.length > 0,
      capabilities: availableFeatures,
      limitations,
      lastSync: lastSync ? new Date(lastSync).toLocaleString() : 'Never',
    };
  }

  /**
   * Suggest actions when offline
   */
  getOfflineSuggestions(): string[] {
    const capabilities = this.getOfflineCapabilities();
    const suggestions: string[] = [];

    if (capabilities.canBrowseRecommendations) {
      suggestions.push('Browse cached recommendations for local insights');
    }

    if (capabilities.canTranslate) {
      suggestions.push('Use cached translations for common phrases');
    }

    if (capabilities.canUsePreferences) {
      suggestions.push('Update your language preferences');
    }

    if (suggestions.length === 0) {
      suggestions.push('Connect to the internet to access all features');
      suggestions.push('The app will automatically sync when connection is restored');
    } else {
      suggestions.push('Connect to the internet for fresh data and full functionality');
    }

    return suggestions;
  }
}

// Export singleton instance
export const offlineFallbackService = OfflineFallbackService.getInstance();