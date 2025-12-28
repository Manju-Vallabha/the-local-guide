import { useQuery, useQueryClient } from '@tanstack/react-query';
import { recommendationService } from '../services/recommendationService';
import { cacheService } from '../services/cacheService';
import type { RecommendationItem, RecommendationSearchParams, RecommendationCategory } from '../types/recommendations';

// Query keys for React Query
export const RECOMMENDATION_QUERY_KEYS = {
  all: ['recommendations'] as const,
  lists: () => [...RECOMMENDATION_QUERY_KEYS.all, 'list'] as const,
  list: (params: RecommendationSearchParams) => [...RECOMMENDATION_QUERY_KEYS.lists(), params] as const,
  search: (query: string, category?: string) => [...RECOMMENDATION_QUERY_KEYS.all, 'search', query, category] as const,
} as const;

/**
 * Hook for fetching recommendations with caching
 */
export function useRecommendations(params: RecommendationSearchParams) {
  return useQuery({
    queryKey: RECOMMENDATION_QUERY_KEYS.list(params),
    queryFn: async (): Promise<RecommendationItem[]> => {
      try {
        const recommendations = await recommendationService.getRecommendations(params);
        
        // Cache the results for offline use
        cacheService.cacheRecommendations(recommendations);
        
        return recommendations;
      } catch (error) {
        // If online request fails, try to get cached data
        if (cacheService.isOffline()) {
          const cachedRecommendations = cacheService.getCachedRecommendations();
          if (cachedRecommendations) {
            return cachedRecommendations;
          }
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: (failureCount) => {
      // Don't retry if we're offline
      if (!navigator.onLine) return false;
      // Retry up to 2 times for network errors
      return failureCount < 2;
    },
    // Use cached data as initial data if available
    initialData: () => {
      const cached = cacheService.getCachedRecommendations();
      return cached || undefined;
    },
    // Refetch when coming back online
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook for searching recommendations with caching
 */
export function useRecommendationSearch(query: string, category?: string) {
  return useQuery({
    queryKey: RECOMMENDATION_QUERY_KEYS.search(query, category),
    queryFn: async (): Promise<RecommendationItem[]> => {
      try {
        return await recommendationService.searchRecommendations(query, category);
      } catch (error) {
        // If online search fails, try to search in cached data
        if (cacheService.isOffline()) {
          const cachedRecommendations = cacheService.getCachedRecommendations();
          if (cachedRecommendations) {
            // Simple client-side search in cached data
            return cachedRecommendations.filter(item => 
              item.name.toLowerCase().includes(query.toLowerCase()) ||
              item.description.toLowerCase().includes(query.toLowerCase()) ||
              (category ? item.category === category : true)
            );
          }
        }
        throw error;
      }
    },
    enabled: query.length > 0, // Only run query if there's a search term
    staleTime: 2 * 60 * 1000, // 2 minutes (search results change more frequently)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount) => {
      if (!navigator.onLine) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook for prefetching popular recommendations
 */
export function usePrefetchRecommendations() {
  const queryClient = useQueryClient();

  const prefetchPopular = async () => {
    await queryClient.prefetchQuery({
      queryKey: RECOMMENDATION_QUERY_KEYS.list({ category: 'all', limit: 20 }),
      queryFn: () => recommendationService.getRecommendations({ category: 'all', limit: 20 }),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  const prefetchByCategory = async (category: RecommendationCategory | 'all') => {
    await queryClient.prefetchQuery({
      queryKey: RECOMMENDATION_QUERY_KEYS.list({ category, limit: 10 }),
      queryFn: () => recommendationService.getRecommendations({ category, limit: 10 }),
      staleTime: 10 * 60 * 1000,
    });
  };

  return {
    prefetchPopular,
    prefetchByCategory,
  };
}

/**
 * Hook for managing recommendation cache
 */
export function useRecommendationCache() {
  const queryClient = useQueryClient();

  const invalidateRecommendations = () => {
    queryClient.invalidateQueries({
      queryKey: RECOMMENDATION_QUERY_KEYS.all,
    });
  };

  const clearRecommendationCache = () => {
    queryClient.removeQueries({
      queryKey: RECOMMENDATION_QUERY_KEYS.all,
    });
    cacheService.clearCache('local-guide-recommendations');
  };

  const getOfflineRecommendations = (): RecommendationItem[] => {
    return cacheService.getCachedRecommendations() || [];
  };

  return {
    invalidateRecommendations,
    clearRecommendationCache,
    getOfflineRecommendations,
  };
}