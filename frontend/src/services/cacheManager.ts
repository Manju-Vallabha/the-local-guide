import { QueryClient } from '@tanstack/react-query';
import { cacheService } from './cacheService';

interface CacheCleanupOptions {
  maxAge?: number;
  maxSize?: number;
  preserveEssential?: boolean;
}

interface CacheStats {
  totalItems: number;
  totalSize: number;
  oldestItem: number | null;
  newestItem: number | null;
  expiredItems: number;
}

/**
 * Advanced cache management service
 */
export class CacheManager {
  private static instance: CacheManager;
  private cleanupInterval: number | null = null;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private readonly MAX_STORAGE_PERCENTAGE = 0.85; // 85% of quota

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize cache management with automatic cleanup
   */
  initialize(queryClient: QueryClient): void {
    console.log('Initializing cache manager...');

    // Start periodic cleanup
    this.startPeriodicCleanup(queryClient);

    // Set up storage event listeners
    this.setupStorageEventListeners();

    // Initial cleanup
    this.performCleanup({ preserveEssential: true });
  }

  /**
   * Start periodic cache cleanup
   */
  private startPeriodicCleanup(queryClient: QueryClient): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = window.setInterval(async () => {
      console.log('Performing periodic cache cleanup...');
      
      try {
        await this.performCleanup({ preserveEssential: true });
        
        // Also cleanup React Query cache
        queryClient.getQueryCache().clear();
        
        console.log('Periodic cache cleanup completed');
      } catch (error) {
        console.error('Periodic cache cleanup failed:', error);
      }
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Set up storage event listeners
   */
  private setupStorageEventListeners(): void {
    // Listen for storage events from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('local-guide-')) {
        console.log('Cache updated in another tab:', event.key);
        // Could trigger cache invalidation here if needed
      }
    });

    // Listen for quota exceeded errors
    window.addEventListener('error', (event) => {
      if (event.error?.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, performing emergency cleanup');
        this.performEmergencyCleanup();
      }
    });
  }

  /**
   * Perform cache cleanup based on options
   */
  async performCleanup(options: CacheCleanupOptions = {}): Promise<void> {
    const {
      maxAge = 24 * 60 * 60 * 1000, // 24 hours default
      maxSize = 50 * 1024 * 1024, // 50MB default
      preserveEssential = true,
    } = options;

    console.log('Starting cache cleanup with options:', options);

    try {
      // Get current storage info
      const storageInfo = await cacheService.getCacheInfo();
      
      // Clean expired items first
      this.cleanExpiredItems(preserveEssential);

      // If still over limit, clean by age
      if (storageInfo.used > maxSize || storageInfo.percentage > this.MAX_STORAGE_PERCENTAGE) {
        this.cleanByAge(maxAge, preserveEssential);
      }

      // If still over limit, clean by size (LRU)
      const updatedStorageInfo = await cacheService.getCacheInfo();
      if (updatedStorageInfo.used > maxSize || updatedStorageInfo.percentage > this.MAX_STORAGE_PERCENTAGE) {
        this.cleanBySize(maxSize, preserveEssential);
      }

      console.log('Cache cleanup completed');
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }

  /**
   * Clean expired cache items
   */
  private cleanExpiredItems(preserveEssential: boolean): void {
    const allKeys = Object.keys(localStorage);
    let cleanedCount = 0;

    allKeys.forEach(key => {
      if (!key.startsWith('local-guide-')) return;

      // Preserve essential data if requested
      if (preserveEssential && this.isEssentialKey(key)) return;

      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.expiration && Date.now() > parsed.expiration) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        // If we can't parse it, it's probably corrupted - remove it
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} expired cache items`);
    }
  }

  /**
   * Clean cache items by age
   */
  private cleanByAge(maxAge: number, preserveEssential: boolean): void {
    const allKeys = Object.keys(localStorage);
    const cutoffTime = Date.now() - maxAge;
    let cleanedCount = 0;

    const itemsWithAge = allKeys
      .filter(key => key.startsWith('local-guide-'))
      .filter(key => !preserveEssential || !this.isEssentialKey(key))
      .map(key => {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            return {
              key,
              timestamp: parsed.timestamp || 0,
              size: item.length,
            };
          }
        } catch (error) {
          return { key, timestamp: 0, size: 0 };
        }
        return null;
      })
      .filter(item => item !== null)
      .sort((a, b) => a!.timestamp - b!.timestamp); // Oldest first

    // Remove items older than maxAge
    itemsWithAge.forEach(item => {
      if (item!.timestamp < cutoffTime) {
        localStorage.removeItem(item!.key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} old cache items`);
    }
  }

  /**
   * Clean cache items by size (LRU)
   */
  private cleanBySize(maxSize: number, preserveEssential: boolean): void {
    const allKeys = Object.keys(localStorage);
    let currentSize = 0;
    let cleanedCount = 0;

    // Calculate current size and get items with metadata
    const itemsWithMetadata = allKeys
      .filter(key => key.startsWith('local-guide-'))
      .filter(key => !preserveEssential || !this.isEssentialKey(key))
      .map(key => {
        const item = localStorage.getItem(key);
        if (item) {
          currentSize += item.length;
          try {
            const parsed = JSON.parse(item);
            return {
              key,
              timestamp: parsed.timestamp || 0,
              size: item.length,
            };
          } catch (error) {
            return { key, timestamp: 0, size: item.length };
          }
        }
        return null;
      })
      .filter(item => item !== null)
      .sort((a, b) => a!.timestamp - b!.timestamp); // Oldest first

    // Remove items until we're under the size limit
    for (const item of itemsWithMetadata) {
      if (currentSize <= maxSize) break;
      
      localStorage.removeItem(item!.key);
      currentSize -= item!.size;
      cleanedCount++;
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} cache items to reduce size`);
    }
  }

  /**
   * Emergency cleanup when storage quota is exceeded
   */
  private performEmergencyCleanup(): void {
    console.warn('Performing emergency cache cleanup');

    // Remove all non-essential cache items
    const allKeys = Object.keys(localStorage);
    let cleanedCount = 0;

    allKeys.forEach(key => {
      if (key.startsWith('local-guide-') && !this.isEssentialKey(key)) {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });

    console.log(`Emergency cleanup removed ${cleanedCount} cache items`);
  }

  /**
   * Check if a cache key is essential and should be preserved
   */
  private isEssentialKey(key: string): boolean {
    const essentialKeys = [
      'userPreferences',
      'local-guide-essential-data',
      'local-guide-last-sync',
    ];

    return essentialKeys.some(essentialKey => key.includes(essentialKey));
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const allKeys = Object.keys(localStorage);
    const cacheKeys = allKeys.filter(key => key.startsWith('local-guide-'));
    
    let totalSize = 0;
    let oldestItem: number | null = null;
    let newestItem: number | null = null;
    let expiredItems = 0;

    cacheKeys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
        
        try {
          const parsed = JSON.parse(item);
          const timestamp = parsed.timestamp || 0;
          
          if (oldestItem === null || timestamp < oldestItem) {
            oldestItem = timestamp;
          }
          if (newestItem === null || timestamp > newestItem) {
            newestItem = timestamp;
          }
          
          if (parsed.expiration && Date.now() > parsed.expiration) {
            expiredItems++;
          }
        } catch (error) {
          // Corrupted item
          expiredItems++;
        }
      }
    });

    return {
      totalItems: cacheKeys.length,
      totalSize,
      oldestItem,
      newestItem,
      expiredItems,
    };
  }

  /**
   * Provide offline fallback data
   */
  getOfflineFallbacks(): {
    hasRecommendations: boolean;
    hasPreferences: boolean;
    hasEssentialData: boolean;
    lastSync: number | null;
  } {
    const fallbackData = cacheService.getOfflineFallback();
    
    return {
      hasRecommendations: fallbackData.recommendations.length > 0,
      hasPreferences: fallbackData.preferences !== null,
      hasEssentialData: fallbackData.essentialData !== null,
      lastSync: cacheService.getLastSync(),
    };
  }

  /**
   * Handle storage limit warnings
   */
  async checkStorageHealth(): Promise<{
    healthy: boolean;
    warnings: string[];
    recommendations: string[];
  }> {
    const storageInfo = await cacheService.getCacheInfo();
    const cacheStats = await this.getCacheStats();
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let healthy = true;

    // Check storage usage
    if (storageInfo.percentage > 0.9) {
      healthy = false;
      warnings.push('Storage is nearly full (>90%)');
      recommendations.push('Clear old cache data or reduce cache size');
    } else if (storageInfo.percentage > 0.8) {
      warnings.push('Storage usage is high (>80%)');
      recommendations.push('Consider clearing old cache data');
    }

    // Check for expired items
    if (cacheStats.expiredItems > 10) {
      warnings.push(`${cacheStats.expiredItems} expired cache items found`);
      recommendations.push('Run cache cleanup to remove expired items');
    }

    // Check cache age
    if (cacheStats.oldestItem && Date.now() - cacheStats.oldestItem > 7 * 24 * 60 * 60 * 1000) {
      warnings.push('Some cache items are very old (>7 days)');
      recommendations.push('Consider refreshing old cache data');
    }

    return {
      healthy,
      warnings,
      recommendations,
    };
  }

  /**
   * Cleanup and stop cache manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    console.log('Cache manager destroyed');
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();