import { QueryClient } from '@tanstack/react-query';
import { cacheService } from './cacheService';
import { recommendationService } from './recommendationService';
import { preferencesService } from './preferencesService';
import { RECOMMENDATION_QUERY_KEYS } from '../hooks/useRecommendations';
import { PREFERENCES_QUERY_KEYS } from '../hooks/usePreferences';
import { RecommendationCategory } from '../types/recommendations';

interface PreloadOptions {
  queryClient: QueryClient;
  forceRefresh?: boolean;
}

interface PreloadResult {
  success: boolean;
  errors: string[];
  preloadedItems: string[];
}

/**
 * Service for preloading essential data on app startup
 */
export class DataPreloader {
  private static instance: DataPreloader;

  static getInstance(): DataPreloader {
    if (!DataPreloader.instance) {
      DataPreloader.instance = new DataPreloader();
    }
    return DataPreloader.instance;
  }

  /**
   * Preload all essential data for the application
   */
  async preloadEssentialData({ queryClient, forceRefresh = false }: PreloadOptions): Promise<PreloadResult> {
    const result: PreloadResult = {
      success: true,
      errors: [],
      preloadedItems: [],
    };

    console.log('Starting essential data preload...');

    try {
      // Check if we need to refresh data
      const needsRefresh = forceRefresh || cacheService.needsRefresh(60 * 60 * 1000); // 1 hour

      if (!needsRefresh && !navigator.onLine) {
        console.log('Using cached data (offline mode)');
        return result;
      }

      // Preload in parallel for better performance
      const preloadTasks = [
        this.preloadUserPreferences(queryClient),
        this.preloadPopularRecommendations(queryClient),
        this.preloadRecommendationCategories(queryClient),
        this.preloadEssentialCacheData(),
      ];

      const results = await Promise.allSettled(preloadTasks);

      // Process results
      results.forEach((taskResult, index) => {
        const taskNames = [
          'User Preferences',
          'Popular Recommendations',
          'Recommendation Categories',
          'Essential Cache Data',
        ];

        if (taskResult.status === 'fulfilled') {
          result.preloadedItems.push(taskNames[index]);
        } else {
          const error = `Failed to preload ${taskNames[index]}: ${taskResult.reason}`;
          result.errors.push(error);
          console.warn(error);
        }
      });

      // Update last sync timestamp
      cacheService.updateLastSync();

      // Set success to false if more than half the tasks failed
      result.success = result.errors.length <= preloadTasks.length / 2;

      console.log(`Preload completed. Success: ${result.success}, Items: ${result.preloadedItems.length}, Errors: ${result.errors.length}`);

    } catch (error) {
      result.success = false;
      result.errors.push(`Preload failed: ${error}`);
      console.error('Essential data preload failed:', error);
    }

    return result;
  }

  /**
   * Preload user preferences
   */
  private async preloadUserPreferences(queryClient: QueryClient): Promise<void> {
    try {
      // Check if already cached and fresh
      const cachedPrefs = cacheService.getCachedUserPreferences();
      if (cachedPrefs && !cacheService.needsRefresh(10 * 60 * 1000)) {
        // Set initial data in query cache
        queryClient.setQueryData(PREFERENCES_QUERY_KEYS.preferences(), cachedPrefs);
        return;
      }

      // Prefetch preferences
      await queryClient.prefetchQuery({
        queryKey: PREFERENCES_QUERY_KEYS.preferences(),
        queryFn: async () => {
          const preferences = await preferencesService.getPreferences();
          cacheService.cacheUserPreferences(preferences);
          return preferences;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    } catch (error) {
      // If API fails, use cached data if available
      const cachedPrefs = cacheService.getCachedUserPreferences();
      if (cachedPrefs) {
        queryClient.setQueryData(PREFERENCES_QUERY_KEYS.preferences(), cachedPrefs);
      } else {
        throw error;
      }
    }
  }

  /**
   * Preload popular recommendations
   */
  private async preloadPopularRecommendations(queryClient: QueryClient): Promise<void> {
    try {
      const params = { category: 'all' as const, limit: 20 };
      
      // Check if already cached and fresh
      const cachedRecs = cacheService.getCachedRecommendations();
      if (cachedRecs && cachedRecs.length > 0 && !cacheService.needsRefresh(30 * 60 * 1000)) {
        queryClient.setQueryData(RECOMMENDATION_QUERY_KEYS.list(params), cachedRecs);
        return;
      }

      // Prefetch popular recommendations
      await queryClient.prefetchQuery({
        queryKey: RECOMMENDATION_QUERY_KEYS.list(params),
        queryFn: async () => {
          const recommendations = await recommendationService.getRecommendations(params);
          cacheService.cacheRecommendations(recommendations);
          return recommendations;
        },
        staleTime: 15 * 60 * 1000, // 15 minutes
      });
    } catch (error) {
      // If API fails, use cached data if available
      const cachedRecs = cacheService.getCachedRecommendations();
      if (cachedRecs && cachedRecs.length > 0) {
        const params = { category: 'all' as const, limit: 20 };
        queryClient.setQueryData(RECOMMENDATION_QUERY_KEYS.list(params), cachedRecs);
      } else {
        throw error;
      }
    }
  }

  /**
   * Preload recommendations for each category
   */
  private async preloadRecommendationCategories(queryClient: QueryClient): Promise<void> {
    const categories: (RecommendationCategory | 'all')[] = ['street_food', 'shops', 'markets', 'souvenirs'];
    
    const categoryTasks = categories.map(async (category) => {
      try {
        const params = { category, limit: 10 };
        
        await queryClient.prefetchQuery({
          queryKey: RECOMMENDATION_QUERY_KEYS.list(params),
          queryFn: () => recommendationService.getRecommendations(params),
          staleTime: 20 * 60 * 1000, // 20 minutes
        });
      } catch (error) {
        console.warn(`Failed to preload category ${category}:`, error);
        // Don't throw, just log the warning
      }
    });

    // Wait for all category preloads (but don't fail if some fail)
    await Promise.allSettled(categoryTasks);
  }

  /**
   * Preload essential cache data
   */
  private async preloadEssentialCacheData(): Promise<void> {
    await cacheService.preloadEssentialData();
  }

  /**
   * Preload common translations for offline use
   */
  async preloadCommonTranslations(targetLanguage: string): Promise<void> {
    const commonPhrases = [
      'Hello',
      'Thank you',
      'How much?',
      'Where is?',
      'Good',
      'Bad',
      'Help',
      'Water',
      'Food',
      'Bathroom',
      'Hotel',
      'Restaurant',
      'Market',
      'Shop',
      'Price',
      'Expensive',
      'Cheap',
      'Delicious',
      'Spicy',
      'Sweet',
    ];

    // Cache common translations
    for (const phrase of commonPhrases) {
      const cacheKey = `auto-${targetLanguage}-${phrase.toLowerCase()}`;
      
      // Only fetch if not already cached
      if (!cacheService.getCachedTranslation(cacheKey)) {
        try {
          // In a real implementation, this would call the translation API
          // For now, we'll just cache the phrase as-is
          cacheService.cacheTranslation(cacheKey, phrase);
        } catch (error) {
          console.warn(`Failed to preload translation for "${phrase}":`, error);
        }
      }
    }
  }

  /**
   * Check preload status
   */
  getPreloadStatus(): {
    lastSync: number | null;
    needsRefresh: boolean;
    hasEssentialData: boolean;
    cacheInfo: Promise<{
      used: number;
      quota: number;
      percentage: number;
      nearLimit: boolean;
    }>;
  } {
    return {
      lastSync: cacheService.getLastSync(),
      needsRefresh: cacheService.needsRefresh(),
      hasEssentialData: !!cacheService.getCachedEssentialData(),
      cacheInfo: cacheService.getCacheInfo(),
    };
  }

  /**
   * Force refresh all preloaded data
   */
  async forceRefresh(queryClient: QueryClient): Promise<PreloadResult> {
    // Clear existing caches
    queryClient.clear();
    cacheService.clearAllCaches();

    // Preload fresh data
    return this.preloadEssentialData({ queryClient, forceRefresh: true });
  }
}

// Export singleton instance
export const dataPreloader = DataPreloader.getInstance();