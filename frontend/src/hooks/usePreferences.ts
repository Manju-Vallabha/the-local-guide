import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preferencesService } from '../services/preferencesService';
import { cacheService } from '../services/cacheService';
import type { UserPreferences } from '../types/user';

// Query keys for React Query
export const PREFERENCES_QUERY_KEYS = {
  all: ['preferences'] as const,
  preferences: () => [...PREFERENCES_QUERY_KEYS.all, 'user'] as const,
  session: () => [...PREFERENCES_QUERY_KEYS.all, 'session'] as const,
} as const;

/**
 * Hook for fetching user preferences with caching
 */
export function useUserPreferences() {
  return useQuery({
    queryKey: PREFERENCES_QUERY_KEYS.preferences(),
    queryFn: async (): Promise<UserPreferences> => {
      try {
        const preferences = await preferencesService.getPreferences();
        
        // Cache the preferences for offline use
        cacheService.cacheUserPreferences(preferences);
        
        return preferences;
      } catch (error) {
        // If online request fails, try to get cached preferences
        const cachedPreferences = cacheService.getCachedUserPreferences();
        if (cachedPreferences) {
          return cachedPreferences;
        }
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: (failureCount) => {
      if (!navigator.onLine) return false;
      return failureCount < 2;
    },
    // Use cached data as initial data if available
    initialData: () => {
      const cached = cacheService.getCachedUserPreferences();
      return cached || undefined;
    },
    refetchOnWindowFocus: false, // Don't refetch preferences on focus
    refetchOnReconnect: true,
  });
}

/**
 * Hook for saving user preferences
 */
export function useSavePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      const result = await preferencesService.savePreferences(preferences);
      
      // Update cache immediately
      cacheService.cacheUserPreferences(preferences);
      
      return result;
    },
    onSuccess: (_data, variables) => {
      // Update the query cache
      queryClient.setQueryData(PREFERENCES_QUERY_KEYS.preferences(), variables);
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: PREFERENCES_QUERY_KEYS.all,
      });
      
      // Invalidate first-time user query since preferences are now set
      queryClient.invalidateQueries({
        queryKey: ['firstTimeUser'],
      });
      
      // Set first-time user to false immediately
      queryClient.setQueryData(['firstTimeUser'], false);
    },
    onError: (error) => {
      console.error('Failed to save preferences:', error);
    },
  });
}

/**
 * Hook for updating specific preference fields
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const result = await preferencesService.updatePreferences(updates);
      
      // Update cache with merged preferences
      const currentPrefs = cacheService.getCachedUserPreferences();
      if (currentPrefs) {
        const updatedPrefs = { ...currentPrefs, ...updates };
        cacheService.cacheUserPreferences(updatedPrefs);
      }
      
      return result;
    },
    onSuccess: (_data, variables) => {
      // Update the query cache by merging with existing data
      queryClient.setQueryData(
        PREFERENCES_QUERY_KEYS.preferences(),
        (oldData: UserPreferences | undefined) => {
          if (!oldData) return variables as UserPreferences;
          return { ...oldData, ...variables };
        }
      );
    },
    onError: (error) => {
      console.error('Failed to update preferences:', error);
    },
  });
}

/**
 * Hook for resetting preferences
 */
export function useResetPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await preferencesService.resetPreferences();
      
      // Clear cached preferences
      cacheService.clearCache('userPreferences');
      
      return result;
    },
    onSuccess: () => {
      // Remove preferences from query cache
      queryClient.removeQueries({
        queryKey: PREFERENCES_QUERY_KEYS.preferences(),
      });
      
      // Invalidate all preference-related queries
      queryClient.invalidateQueries({
        queryKey: PREFERENCES_QUERY_KEYS.all,
      });
    },
    onError: (error) => {
      console.error('Failed to reset preferences:', error);
    },
  });
}

/**
 * Hook for checking if user is first-time
 */
export function useIsFirstTimeUser() {
  return useQuery({
    queryKey: ['firstTimeUser'],
    queryFn: async (): Promise<boolean> => {
      try {
        const isFirstTime = await preferencesService.isFirstTimeUser();
        console.log('useIsFirstTimeUser result:', isFirstTime);
        return isFirstTime;
      } catch (error) {
        console.error('Error checking first-time user:', error);
        // Fallback to checking cached preferences
        const cachedPrefs = cacheService.getCachedUserPreferences();
        const fallbackResult = !cachedPrefs;
        console.log('useIsFirstTimeUser fallback result:', fallbackResult);
        return fallbackResult;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry this query
  });
}

/**
 * Hook for managing preference cache
 */
export function usePreferenceCache() {
  const queryClient = useQueryClient();

  const invalidatePreferences = () => {
    queryClient.invalidateQueries({
      queryKey: PREFERENCES_QUERY_KEYS.all,
    });
  };

  const clearPreferenceCache = () => {
    queryClient.removeQueries({
      queryKey: PREFERENCES_QUERY_KEYS.all,
    });
    cacheService.clearCache('userPreferences');
  };

  const getOfflinePreferences = (): UserPreferences | null => {
    return cacheService.getCachedUserPreferences();
  };

  const syncPreferences = async () => {
    try {
      // Force refetch preferences from server
      await queryClient.refetchQueries({
        queryKey: PREFERENCES_QUERY_KEYS.preferences(),
      });
    } catch (error) {
      console.error('Failed to sync preferences:', error);
    }
  };

  return {
    invalidatePreferences,
    clearPreferenceCache,
    getOfflinePreferences,
    syncPreferences,
  };
}