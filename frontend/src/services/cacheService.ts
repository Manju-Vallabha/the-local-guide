import type { RecommendationItem } from '../types/recommendations';
import type { UserPreferences } from '../types/user';

// Cache keys for different data types
export const CACHE_KEYS = {
  RECOMMENDATIONS: 'local-guide-recommendations',
  ESSENTIAL_DATA: 'local-guide-essential-data',
  TRANSLATIONS: 'local-guide-translations',
  USER_PREFERENCES: 'userPreferences',
  LAST_SYNC: 'local-guide-last-sync',
} as const;

// Cache expiration times (in milliseconds)
export const CACHE_EXPIRATION = {
  RECOMMENDATIONS: 24 * 60 * 60 * 1000, // 24 hours
  ESSENTIAL_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  TRANSLATIONS: 30 * 24 * 60 * 60 * 1000, // 30 days
  USER_PREFERENCES: 365 * 24 * 60 * 60 * 1000, // 1 year
} as const;

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiration: number;
}

interface EssentialData {
  popularRecommendations: RecommendationItem[];
  categories: string[];
  supportedLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
}

export class CacheService {
  private static instance: CacheService;
  private storageQuotaWarningThreshold = 0.8; // 80% of quota

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Store data in cache with expiration
   */
  private setCache<T>(key: string, data: T, expiration: number): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiration: Date.now() + expiration,
      };
      
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache data:', error);
      // Handle storage quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.handleStorageQuotaExceeded();
      }
    }
  }

  /**
   * Get data from cache if not expired
   */
  private getCache<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > cacheItem.expiration) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to read cache:', error);
      return null;
    }
  }

  /**
   * Cache recommendations data
   */
  cacheRecommendations(recommendations: RecommendationItem[]): void {
    this.setCache(CACHE_KEYS.RECOMMENDATIONS, recommendations, CACHE_EXPIRATION.RECOMMENDATIONS);
  }

  /**
   * Get cached recommendations
   */
  getCachedRecommendations(): RecommendationItem[] | null {
    return this.getCache<RecommendationItem[]>(CACHE_KEYS.RECOMMENDATIONS);
  }

  /**
   * Cache essential data for offline use
   */
  cacheEssentialData(data: EssentialData): void {
    this.setCache(CACHE_KEYS.ESSENTIAL_DATA, data, CACHE_EXPIRATION.ESSENTIAL_DATA);
  }

  /**
   * Get cached essential data
   */
  getCachedEssentialData(): EssentialData | null {
    return this.getCache<EssentialData>(CACHE_KEYS.ESSENTIAL_DATA);
  }

  /**
   * Cache translation results
   */
  cacheTranslation(key: string, translation: string): void {
    const translations = this.getCachedTranslations() || {};
    translations[key] = translation;
    this.setCache(CACHE_KEYS.TRANSLATIONS, translations, CACHE_EXPIRATION.TRANSLATIONS);
  }

  /**
   * Get cached translation
   */
  getCachedTranslation(key: string): string | null {
    const translations = this.getCachedTranslations();
    return translations?.[key] || null;
  }

  /**
   * Get all cached translations
   */
  getCachedTranslations(): Record<string, string> | null {
    return this.getCache<Record<string, string>>(CACHE_KEYS.TRANSLATIONS);
  }

  /**
   * Cache user preferences
   */
  cacheUserPreferences(preferences: UserPreferences): void {
    this.setCache(CACHE_KEYS.USER_PREFERENCES, preferences, CACHE_EXPIRATION.USER_PREFERENCES);
  }

  /**
   * Get cached user preferences
   */
  getCachedUserPreferences(): UserPreferences | null {
    return this.getCache<UserPreferences>(CACHE_KEYS.USER_PREFERENCES);
  }

  /**
   * Update last sync timestamp
   */
  updateLastSync(): void {
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
  }

  /**
   * Get last sync timestamp
   */
  getLastSync(): number | null {
    const lastSync = localStorage.getItem(CACHE_KEYS.LAST_SYNC);
    return lastSync ? parseInt(lastSync, 10) : null;
  }

  /**
   * Check if data needs refresh based on last sync
   */
  needsRefresh(maxAge: number = 60 * 60 * 1000): boolean {
    const lastSync = this.getLastSync();
    if (!lastSync) return true;
    
    return Date.now() - lastSync > maxAge;
  }

  /**
   * Clear specific cache
   */
  clearCache(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all app caches
   */
  clearAllCaches(): void {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Get cache size information
   */
  async getCacheInfo(): Promise<{
    used: number;
    quota: number;
    percentage: number;
    nearLimit: boolean;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? used / quota : 0;
        
        return {
          used,
          quota,
          percentage,
          nearLimit: percentage > this.storageQuotaWarningThreshold,
        };
      } catch (error) {
        console.warn('Failed to get storage estimate:', error);
      }
    }

    // Fallback for browsers that don't support storage estimation
    return {
      used: 0,
      quota: 0,
      percentage: 0,
      nearLimit: false,
    };
  }

  /**
   * Handle storage quota exceeded
   */
  private handleStorageQuotaExceeded(): void {
    console.warn('Storage quota exceeded, clearing old cache data');
    
    // Clear expired items first
    this.clearExpiredItems();
    
    // If still having issues, clear oldest non-essential caches
    const cacheInfo = Object.entries(CACHE_KEYS).map(([name, key]) => ({
      name,
      key,
      item: localStorage.getItem(key),
    })).filter(cache => cache.item);

    // Sort by timestamp (oldest first) and remove non-essential items
    cacheInfo
      .map(cache => ({
        ...cache,
        timestamp: JSON.parse(cache.item!).timestamp || 0,
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, Math.ceil(cacheInfo.length / 2)) // Remove oldest half
      .forEach(cache => {
        if (cache.key !== CACHE_KEYS.USER_PREFERENCES) { // Keep user preferences
          localStorage.removeItem(cache.key);
        }
      });
  }

  /**
   * Clear expired cache items
   */
  private clearExpiredItems(): void {
    Object.values(CACHE_KEYS).forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheItem = JSON.parse(cached);
          if (Date.now() > cacheItem.expiration) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // If we can't parse it, remove it
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Preload essential data for offline use
   */
  async preloadEssentialData(): Promise<void> {
    // This will be called during app initialization
    // Check if we already have fresh essential data
    const cachedData = this.getCachedEssentialData();
    if (cachedData && !this.needsRefresh(CACHE_EXPIRATION.ESSENTIAL_DATA)) {
      return;
    }

    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll create some default essential data
      const essentialData: EssentialData = {
        popularRecommendations: [],
        categories: ['street_food', 'shops', 'markets', 'souvenirs', 'clothing', 'crafts'],
        supportedLanguages: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
          { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
        ],
      };

      this.cacheEssentialData(essentialData);
      this.updateLastSync();
    } catch (error) {
      console.warn('Failed to preload essential data:', error);
    }
  }

  /**
   * Check if app is in offline mode
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Get offline fallback data
   */
  getOfflineFallback(): {
    recommendations: RecommendationItem[];
    essentialData: EssentialData | null;
    preferences: UserPreferences | null;
  } {
    return {
      recommendations: this.getCachedRecommendations() || [],
      essentialData: this.getCachedEssentialData(),
      preferences: this.getCachedUserPreferences(),
    };
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();