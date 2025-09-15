/**
 * Global Cache Manager for Protocol Data
 * Provides a unified caching layer with TTL support
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class GlobalCache {
  private static instance: GlobalCache;
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number;

  private constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  static getInstance(): GlobalCache {
    if (!GlobalCache.instance) {
      GlobalCache.instance = new GlobalCache();
    }
    return GlobalCache.instance;
  }

  /**
   * Get cached data if not expired
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache with optional custom TTL
   */
  set<T = any>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Check if cache exists and is valid
   */
  has(key: string): boolean {
    const data = this.get(key);
    return data !== null;
  }

  /**
   * Clear specific key or entire cache
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get multiple cache entries at once
   */
  getMultiple<T = any>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    for (const key of keys) {
      const data = this.get<T>(key);
      if (data !== null) {
        results.set(key, data);
      }
    }
    return results;
  }

  /**
   * Set multiple cache entries at once
   */
  setMultiple<T = any>(entries: Map<string, T>, ttl?: number): void {
    entries.forEach((data, key) => {
      this.set(key, data, ttl);
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Check if cache entry is fresh (cached within last minute)
   */
  isFresh(key: string, freshnessWindow = 60000): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    return age < freshnessWindow;
  }
}

// Export singleton instance
export const globalCache = GlobalCache.getInstance();