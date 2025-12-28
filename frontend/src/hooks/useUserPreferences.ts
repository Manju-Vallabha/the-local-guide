// Re-export the React Query-based hooks for backward compatibility
export { 
  useUserPreferences as useUserPreferencesQuery,
  useSavePreferences,
  useUpdatePreferences,
  useResetPreferences,
  useIsFirstTimeUser,
  usePreferenceCache,
} from './usePreferences';

// Legacy hook wrapper for backward compatibility
import { useUserPreferences as useUserPreferencesQuery } from './usePreferences';
import { useSavePreferences, useUpdatePreferences, useResetPreferences, useIsFirstTimeUser } from './usePreferences';
import type { UserPreferences } from '../types/user';

interface UseUserPreferencesReturn {
  preferences: UserPreferences | undefined;
  loading: boolean;
  error: string | null;
  isFirstTimeUser: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  savePreferences: (preferences: UserPreferences) => Promise<void>;
  resetPreferences: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

/**
 * Main hook for user preferences (React Query-based)
 */
export const useUserPreferences = (): UseUserPreferencesReturn => {
  const { data: preferences, isLoading, error, refetch } = useUserPreferencesQuery();
  const { data: isFirstTime } = useIsFirstTimeUser();
  const saveMutation = useSavePreferences();
  const updateMutation = useUpdatePreferences();
  const resetMutation = useResetPreferences();

  return {
    preferences,
    loading: isLoading,
    error: error?.message || null,
    isFirstTimeUser: isFirstTime || false,
    updatePreferences: async (updates: Partial<UserPreferences>) => {
      await updateMutation.mutateAsync(updates);
    },
    savePreferences: async (newPreferences: UserPreferences) => {
      await saveMutation.mutateAsync(newPreferences);
    },
    resetPreferences: async () => {
      await resetMutation.mutateAsync();
    },
    refreshPreferences: async () => {
      await refetch();
    },
  };
};