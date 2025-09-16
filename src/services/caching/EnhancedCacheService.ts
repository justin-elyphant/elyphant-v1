/**
 * Phase 2: Enhanced Caching Service
 * 
 * This service provides multi-layer caching with Redis/Upstash as a shared cache
 * between edge function instances while maintaining existing Map-based cache
 * as the primary fast layer.
 * 
 * Cache Hierarchy:
 * 1. Primary: In-memory Map cache (existing) - fastest access
 * 2. Secondary: Redis/Upstash cache - shared between instances
 * 3. Fallback: Direct API calls with existing protective measures
 */

import { Redis } from '@upstash/redis';

export interface CacheEntry {
  data: any;
  timestamp: number;
  version: string;
  category?: string;
  searchTerm?: string;
  ttl: number;
}

export interface CacheWarmerConfig {
  categories: string[];
  intervals: {
    popular: number;    // Every 15 minutes
    standard: number;   // Every hour  
    fallback: number;   // Every 4 hours
  };
  priorityTerms: string[];
}

/**
 * Enhanced Cache Service with Redis/Upstash integration
 * 
 * Provides multi-layer caching while preserving all existing protective measures
 */
export class EnhancedCacheService {
  private static redis: Redis | null = null;
  private static cacheVersion = 'v1.0.0';
  private static isRedisEnabled = false;

  // Cache TTL configurations (in seconds)
  private static readonly CACHE_TTL = {
    POPULAR_CATEGORIES: 15 * 60,     // 15 minutes for popular categories
    STANDARD_CATEGORIES: 60 * 60,    // 1 hour for standard categories  
    SEARCH_RESULTS: 30 * 60,         // 30 minutes for search results
    FALLBACK: 4 * 60 * 60,          // 4 hours for fallback data
    BRAND_SEARCHES: 45 * 60,         // 45 minutes for brand searches
  };

  /**
   * Initialize Redis connection with error handling
   */
  static async initialize(): Promise<void> {
    try {
      // Only initialize if we have Redis URL (optional enhancement)
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (redisUrl && redisToken) {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });

        // Test connection
        await this.redis.ping();
        this.isRedisEnabled = true;
        console.log('[EnhancedCacheService] Redis cache initialized successfully');
      } else {
        console.log('[EnhancedCacheService] Redis credentials not found, using Map-only caching');
        this.isRedisEnabled = false;
      }
    } catch (error) {
      console.warn('[EnhancedCacheService] Redis initialization failed, falling back to Map-only caching:', error);
      this.isRedisEnabled = false;
    }
  }

  /**
   * Generate cache key with version and category information
   */
  private static generateCacheKey(
    type: string,
    category: string,
    searchTerm: string = '',
    options: any = {}
  ): string {
    const optionsHash = JSON.stringify(options).replace(/[^a-zA-Z0-9]/g, '');
    return `${this.cacheVersion}:${type}:${category}:${searchTerm}:${optionsHash}`;
  }

  /**
   * Get from multi-layer cache (Map first, then Redis)
   */
  static async get(
    type: string,
    category: string, 
    searchTerm: string = '',
    options: any = {},
    mapCache?: Map<string, any>
  ): Promise<CacheEntry | null> {
    const cacheKey = this.generateCacheKey(type, category, searchTerm, options);

    try {
      // Layer 1: Check Map cache first (existing fast cache)
      if (mapCache && mapCache.has(cacheKey)) {
        const mapEntry = mapCache.get(cacheKey);
        if (mapEntry && this.isValidCacheEntry(mapEntry)) {
          console.log(`[EnhancedCacheService] Cache HIT (Map): ${cacheKey}`);
          return mapEntry;
        } else {
          mapCache.delete(cacheKey); // Clean expired entry
        }
      }

      // Layer 2: Check Redis cache if enabled
      if (this.isRedisEnabled && this.redis) {
        const redisEntry = await this.redis.get(cacheKey);
        if (redisEntry && this.isValidCacheEntry(redisEntry)) {
          console.log(`[EnhancedCacheService] Cache HIT (Redis): ${cacheKey}`);
          
          // Warm Map cache for faster future access
          if (mapCache) {
            mapCache.set(cacheKey, redisEntry);
          }
          
          return redisEntry as CacheEntry;
        }
      }

      console.log(`[EnhancedCacheService] Cache MISS: ${cacheKey}`);
      return null;

    } catch (error) {
      console.error('[EnhancedCacheService] Cache get error:', error);
      return null;
    }
  }

  /**
   * Set in multi-layer cache (both Map and Redis)
   */
  static async set(
    type: string,
    category: string,
    searchTerm: string = '',
    data: any,
    options: any = {},
    mapCache?: Map<string, any>
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(type, category, searchTerm, options);
    const ttl = this.getTTLForCategory(category, type);
    
    const cacheEntry: CacheEntry = {
      data,
      timestamp: Date.now(),
      version: this.cacheVersion,
      category,
      searchTerm,
      ttl
    };

    try {
      // Set in Map cache (primary fast layer)
      if (mapCache) {
        mapCache.set(cacheKey, cacheEntry);
      }

      // Set in Redis cache (secondary shared layer)
      if (this.isRedisEnabled && this.redis) {
        await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheEntry));
      }

      console.log(`[EnhancedCacheService] Cache SET: ${cacheKey} (TTL: ${ttl}s)`);

    } catch (error) {
      console.error('[EnhancedCacheService] Cache set error:', error);
      // Don't throw - caching failure shouldn't break the application
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private static isValidCacheEntry(entry: any): boolean {
    if (!entry || typeof entry !== 'object') return false;
    
    const now = Date.now();
    const age = now - (entry.timestamp || 0);
    const maxAge = (entry.ttl || this.CACHE_TTL.STANDARD_CATEGORIES) * 1000;
    
    return age < maxAge && entry.version === this.cacheVersion;
  }

  /**
   * Get appropriate TTL based on category popularity and type
   */
  private static getTTLForCategory(category: string, type: string): number {
    // Popular categories get shorter TTL for fresher data
    const popularCategories = ['best-selling', 'electronics', 'gifts-for-her', 'gifts-for-him'];
    
    if (popularCategories.includes(category)) {
      return this.CACHE_TTL.POPULAR_CATEGORIES;
    }
    
    if (type === 'brand-search') {
      return this.CACHE_TTL.BRAND_SEARCHES;
    }
    
    if (type === 'search-results') {
      return this.CACHE_TTL.SEARCH_RESULTS;
    }
    
    return this.CACHE_TTL.STANDARD_CATEGORIES;
  }

  /**
   * Warm cache for popular categories and search terms
   */
  static async warmCache(
    searchFunction: (category: string, term?: string, options?: any) => Promise<any>,
    config: CacheWarmerConfig,
    mapCache?: Map<string, any>
  ): Promise<void> {
    console.log('[EnhancedCacheService] Starting cache warming...');

    try {
      const warmingPromises: Promise<void>[] = [];

      // Warm popular categories
      for (const category of config.categories) {
        warmingPromises.push(
          this.warmCategoryCache(category, searchFunction, mapCache)
        );
      }

      // Warm priority search terms
      for (const term of config.priorityTerms) {
        warmingPromises.push(
          this.warmSearchTermCache(term, searchFunction, mapCache)
        );
      }

      await Promise.allSettled(warmingPromises);
      console.log('[EnhancedCacheService] Cache warming completed');

    } catch (error) {
      console.error('[EnhancedCacheService] Cache warming error:', error);
      // Don't throw - warming failure shouldn't break the application
    }
  }

  /**
   * Warm cache for a specific category
   */
  private static async warmCategoryCache(
    category: string,
    searchFunction: (category: string, term?: string, options?: any) => Promise<any>,
    mapCache?: Map<string, any>
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey('category-search', category);
      
      // Check if already cached
      const existing = await this.get('category-search', category, '', {}, mapCache);
      if (existing) {
        console.log(`[EnhancedCacheService] Skipping warm for cached category: ${category}`);
        return;
      }

      console.log(`[EnhancedCacheService] Warming cache for category: ${category}`);
      const results = await searchFunction(category, '', { limit: 20 });
      
      if (results && (results.results || results.length > 0)) {
        await this.set('category-search', category, '', results, {}, mapCache);
      }

    } catch (error) {
      console.error(`[EnhancedCacheService] Failed to warm cache for category ${category}:`, error);
    }
  }

  /**
   * Warm cache for a specific search term
   */
  private static async warmSearchTermCache(
    searchTerm: string,
    searchFunction: (category: string, term?: string, options?: any) => Promise<any>,
    mapCache?: Map<string, any>
  ): Promise<void> {
    try {
      console.log(`[EnhancedCacheService] Warming cache for search term: ${searchTerm}`);
      const results = await searchFunction('default', searchTerm, { limit: 20 });
      
      if (results && (results.results || results.length > 0)) {
        await this.set('search-results', 'default', searchTerm, results, {}, mapCache);
      }

    } catch (error) {
      console.error(`[EnhancedCacheService] Failed to warm cache for term ${searchTerm}:`, error);
    }
  }

  /**
   * Invalidate cache entries by pattern (useful for updates)
   */
  static async invalidatePattern(pattern: string, mapCache?: Map<string, any>): Promise<void> {
    try {
      // Clear from Map cache
      if (mapCache) {
        const keysToDelete: string[] = [];
        for (const key of mapCache.keys()) {
          if (key.includes(pattern)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => mapCache.delete(key));
        console.log(`[EnhancedCacheService] Invalidated ${keysToDelete.length} Map cache entries matching: ${pattern}`);
      }

      // Clear from Redis cache (if enabled)
      if (this.isRedisEnabled && this.redis) {
        // Note: Redis SCAN would be used in production for pattern matching
        // For now, we'll rely on TTL expiration
        console.log(`[EnhancedCacheService] Redis pattern invalidation queued for: ${pattern}`);
      }

    } catch (error) {
      console.error('[EnhancedCacheService] Cache invalidation error:', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  static async getCacheStats(mapCache?: Map<string, any>): Promise<any> {
    const stats = {
      mapCacheSize: mapCache ? mapCache.size : 0,
      redisCacheEnabled: this.isRedisEnabled,
      cacheVersion: this.cacheVersion,
      timestamp: new Date().toISOString()
    };

    if (this.isRedisEnabled && this.redis) {
      try {
        // Note: Redis memory info would be available in production
        stats['redisEnabled'] = true;
      } catch (error) {
        console.error('[EnhancedCacheService] Failed to get Redis stats:', error);
      }
    }

    return stats;
  }
}

// Auto-initialize on module load
if (typeof window === 'undefined') {
  // Only initialize on server-side (Edge Functions)
  EnhancedCacheService.initialize().catch(console.error);
}