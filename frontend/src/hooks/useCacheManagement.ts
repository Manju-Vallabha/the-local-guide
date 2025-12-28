import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cacheManager } from '../services/cacheManager';
import { cacheService } from '../services/cacheService';

interface CacheHealth {
  healthy: boolean;
  warnings: string[];
  recommendations: string[];
}

interface CacheStats {
  totalItems: number;
  totalSize: number;
  oldestItem: number | null;
  newestItem: number | null;
  expiredItems: number;
}

interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
  nearLimit: boolean;
}

interface OfflineFallbacks {
  hasRecommendations: boolean;
  hasPreferences: boolean;
  hasEssentialData: boolean;
  lastSync: number | null;
}

/**
 * Hook for managing cache health and cleanup
 */
export function useCacheManagement() {
  const queryClient = useQueryClient();
  const [cacheHealth, setCacheHealth] = useState<CacheHealth | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cache information
  const loadCacheInfo = useCallback(async () => {
    try {
      const [health, stats, storage] = await Promise.all([
        cacheManager.checkStorageHealth(),
        cacheManager.getCacheStats(),
        cacheService.getCacheInfo(),
      ]);

      setCacheHealth(health);
      setCacheStats(stats);
      setStorageInfo(storage);
    } catch (error) {
      console.error('Failed to load cache info:', error);
    }
  }, []);

  // Load cache info on mount and periodically
  useEffect(() => {
    loadCacheInfo();

    // Refresh cache info every 5 minutes
    const interval = setInterval(loadCacheInfo, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadCacheInfo]);

  // Perform cache cleanup
  const performCleanup = useCallback(async (preserveEssential = true) => {
    try {
      await cacheManager.performCleanup({ preserveEssential });
      await loadCacheInfo(); // Refresh stats after cleanup
      return true;
    } catch (error) {
      console.error('Cache cleanup failed:', error);
      return false;
    }
  }, [loadCacheInfo]);

  // Clear all caches
  const clearAllCaches = useCallback(async () => {
    try {
      // Clear React Query cache
      queryClient.clear();
      
      // Clear local storage caches
      cacheService.clearAllCaches();
      
      await loadCacheInfo(); // Refresh stats
      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  }, [queryClient, loadCacheInfo]);

  // Get offline fallback data
  const getOfflineFallbacks = useCallback((): OfflineFallbacks => {
    return cacheManager.getOfflineFallbacks();
  }, []);

  // Check if app can work offline
  const canWorkOffline = useCallback((): boolean => {
    const fallbacks = getOfflineFallbacks();
    return fallbacks.hasEssentialData && fallbacks.hasPreferences;
  }, [getOfflineFallbacks]);

  // Get formatted storage size
  const formatStorageSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Get cache age description
  const getCacheAge = useCallback((timestamp: number | null): string => {
    if (!timestamp) return 'Unknown';
    
    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }, []);

  return {
    // State
    cacheHealth,
    cacheStats,
    storageInfo,
    isOnline,
    
    // Actions
    performCleanup,
    clearAllCaches,
    loadCacheInfo,
    
    // Utilities
    getOfflineFallbacks,
    canWorkOffline,
    formatStorageSize,
    getCacheAge,
  };
}

/**
 * Hook for monitoring storage quota
 */
export function useStorageQuota() {
  const [quotaInfo, setQuotaInfo] = useState<{
    used: number;
    quota: number;
    percentage: number;
    available: number;
  } | null>(null);

  const [isNearLimit, setIsNearLimit] = useState(false);

  const checkQuota = useCallback(async () => {
    try {
      const info = await cacheService.getCacheInfo();
      const available = info.quota - info.used;
      
      setQuotaInfo({
        used: info.used,
        quota: info.quota,
        percentage: info.percentage,
        available,
      });
      
      setIsNearLimit(info.nearLimit);
    } catch (error) {
      console.error('Failed to check storage quota:', error);
    }
  }, []);

  useEffect(() => {
    checkQuota();
    
    // Check quota every minute
    const interval = setInterval(checkQuota, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkQuota]);

  return {
    quotaInfo,
    isNearLimit,
    checkQuota,
  };
}

/**
 * Hook for offline mode detection and handling
 */
export function useOfflineMode() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineSince, setOfflineSince] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setOfflineSince(null);
      console.log('App came back online');
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOfflineSince(Date.now());
      console.log('App went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial offline time if already offline
    if (!navigator.onLine && !offlineSince) {
      setOfflineSince(Date.now());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineSince]);

  const getOfflineDuration = useCallback((): number => {
    if (!isOffline || !offlineSince) return 0;
    return Date.now() - offlineSince;
  }, [isOffline, offlineSince]);

  const getOfflineDurationText = useCallback((): string => {
    const duration = getOfflineDuration();
    if (duration === 0) return '';
    
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }, [getOfflineDuration]);

  return {
    isOffline,
    offlineSince,
    getOfflineDuration,
    getOfflineDurationText,
  };
}