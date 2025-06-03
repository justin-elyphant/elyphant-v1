
/**
 * Enhanced multi-layer caching system for Zinc API optimization
 * Supports memory, session, and persistent localStorage caching
 */

import { ZincProduct } from '@/components/marketplace/zinc/types';

interface CacheEntry {
  timestamp: number;
  results: ZincProduct[];
  query: string;
  hitCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalSearches: number;
  cacheHits: number;
  cacheMisses: number;
  apiCallsSaved: number;
  costSaved: number;
}

// Cache configuration
const CACHE_CONFIG = {
  MEMORY_EXPIRY: 30 * 60 * 1000, // 30 minutes
  SESSION_EXPIRY: 2 * 60 * 60 * 1000, // 2 hours
  PERSISTENT_EXPIRY: 4 * 60 * 60 * 1000, // 4 hours
  MAX_MEMORY_ENTRIES: 50,
  MAX_SESSION_ENTRIES: 100,
  MAX_PERSISTENT_ENTRIES: 200,
  MAX_RESULTS_PER_ENTRY: 50,
  COST_PER_API_CALL: 0.01 // $0.01 per call based on your screenshot
};

class SearchCacheService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    totalSearches: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCallsSaved: 0,
    costSaved: 0
  };

  // Normalize query for consistent caching
  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  // Generate cache key with variations
  private getCacheKey(query: string): string {
    return `zinc_search_${this.normalizeQuery(query)}`;
  }

  // Get similar cache keys for query recycling
  private getSimilarCacheKeys(query: string): string[] {
    const normalized = this.normalizeQuery(query);
    const words = normalized.split(' ');
    const keys: string[] = [];
    
    // Try different word combinations
    if (words.length > 1) {
      // Individual words
      words.forEach(word => {
        if (word.length >= 3) {
          keys.push(`zinc_search_${word}`);
        }
      });
      
      // Partial combinations
      for (let i = 0; i < words.length - 1; i++) {
        keys.push(`zinc_search_${words.slice(i, i + 2).join(' ')}`);
      }
    }
    
    return keys;
  }

  // Memory cache operations
  private getFromMemoryCache(key: string): ZincProduct[] | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > CACHE_CONFIG.MEMORY_EXPIRY) {
      this.memoryCache.delete(key);
      return null;
    }
    
    entry.hitCount++;
    entry.lastAccessed = Date.now();
    return [...entry.results]; // Return copy
  }

  private saveToMemoryCache(key: string, query: string, results: ZincProduct[]): void {
    // Clean up old entries if at capacity
    if (this.memoryCache.size >= CACHE_CONFIG.MAX_MEMORY_ENTRIES) {
      const oldestKey = Array.from(this.memoryCache.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)[0][0];
      this.memoryCache.delete(oldestKey);
    }
    
    this.memoryCache.set(key, {
      timestamp: Date.now(),
      results: results.slice(0, CACHE_CONFIG.MAX_RESULTS_PER_ENTRY),
      query,
      hitCount: 0,
      lastAccessed: Date.now()
    });
  }

  // Session storage operations
  private getFromSessionCache(key: string): ZincProduct[] | null {
    try {
      const data = sessionStorage.getItem(key);
      if (!data) return null;
      
      const entry: CacheEntry = JSON.parse(data);
      if (Date.now() - entry.timestamp > CACHE_CONFIG.SESSION_EXPIRY) {
        sessionStorage.removeItem(key);
        return null;
      }
      
      return entry.results;
    } catch {
      return null;
    }
  }

  private saveToSessionCache(key: string, query: string, results: ZincProduct[]): void {
    try {
      const entry: CacheEntry = {
        timestamp: Date.now(),
        results: results.slice(0, CACHE_CONFIG.MAX_RESULTS_PER_ENTRY),
        query,
        hitCount: 0,
        lastAccessed: Date.now()
      };
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Session cache storage failed:', error);
    }
  }

  // Persistent localStorage operations
  private getFromPersistentCache(key: string): ZincProduct[] | null {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      const entry: CacheEntry = JSON.parse(data);
      if (Date.now() - entry.timestamp > CACHE_CONFIG.PERSISTENT_EXPIRY) {
        localStorage.removeItem(key);
        return null;
      }
      
      return entry.results;
    } catch {
      return null;
    }
  }

  private saveToPersistentCache(key: string, query: string, results: ZincProduct[]): void {
    try {
      const entry: CacheEntry = {
        timestamp: Date.now(),
        results: results.slice(0, CACHE_CONFIG.MAX_RESULTS_PER_ENTRY),
        query,
        hitCount: 0,
        lastAccessed: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(entry));
      
      // Clean up old entries periodically
      this.cleanupPersistentCache();
    } catch (error) {
      console.warn('Persistent cache storage failed:', error);
    }
  }

  private cleanupPersistentCache(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('zinc_search_'));
      if (keys.length > CACHE_CONFIG.MAX_PERSISTENT_ENTRIES) {
        // Remove oldest entries
        const entries = keys.map(key => {
          try {
            const data = localStorage.getItem(key);
            const entry = data ? JSON.parse(data) : null;
            return { key, timestamp: entry?.timestamp || 0 };
          } catch {
            return { key, timestamp: 0 };
          }
        }).sort((a, b) => a.timestamp - b.timestamp);
        
        const toRemove = entries.slice(0, keys.length - CACHE_CONFIG.MAX_PERSISTENT_ENTRIES);
        toRemove.forEach(({ key }) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  // Main cache retrieval with fallback layers
  getCachedResults(query: string): ZincProduct[] | null {
    if (!query || query.trim().length < 3) return null;
    
    const key = this.getCacheKey(query);
    this.stats.totalSearches++;
    
    // Try memory cache first (fastest)
    let results = this.getFromMemoryCache(key);
    if (results && results.length > 0) {
      this.stats.cacheHits++;
      this.stats.apiCallsSaved++;
      this.stats.costSaved += CACHE_CONFIG.COST_PER_API_CALL;
      console.log(`Cache HIT (memory): "${query}" - ${results.length} results`);
      return results;
    }
    
    // Try session cache
    results = this.getFromSessionCache(key);
    if (results && results.length > 0) {
      // Promote to memory cache
      this.saveToMemoryCache(key, query, results);
      this.stats.cacheHits++;
      this.stats.apiCallsSaved++;
      this.stats.costSaved += CACHE_CONFIG.COST_PER_API_CALL;
      console.log(`Cache HIT (session): "${query}" - ${results.length} results`);
      return results;
    }
    
    // Try persistent cache
    results = this.getFromPersistentCache(key);
    if (results && results.length > 0) {
      // Promote to memory and session cache
      this.saveToMemoryCache(key, query, results);
      this.saveToSessionCache(key, query, results);
      this.stats.cacheHits++;
      this.stats.apiCallsSaved++;
      this.stats.costSaved += CACHE_CONFIG.COST_PER_API_CALL;
      console.log(`Cache HIT (persistent): "${query}" - ${results.length} results`);
      return results;
    }
    
    // Try result recycling from similar queries
    const similarKeys = this.getSimilarCacheKeys(query);
    for (const similarKey of similarKeys) {
      results = this.getFromMemoryCache(similarKey) || 
                this.getFromSessionCache(similarKey) || 
                this.getFromPersistentCache(similarKey);
      
      if (results && results.length > 0) {
        // Filter results that might be relevant
        const relevantResults = results.filter(product => {
          const searchTerms = this.normalizeQuery(query).split(' ');
          const productText = `${product.title} ${product.description || ''} ${product.category || ''}`.toLowerCase();
          return searchTerms.some(term => productText.includes(term));
        });
        
        if (relevantResults.length > 0) {
          console.log(`Cache HIT (recycled): "${query}" from "${similarKey}" - ${relevantResults.length} results`);
          // Cache the recycled results
          this.cacheResults(query, relevantResults);
          this.stats.cacheHits++;
          this.stats.apiCallsSaved++;
          this.stats.costSaved += CACHE_CONFIG.COST_PER_API_CALL;
          return relevantResults;
        }
      }
    }
    
    this.stats.cacheMisses++;
    console.log(`Cache MISS: "${query}"`);
    return null;
  }

  // Cache new results across all layers
  cacheResults(query: string, results: ZincProduct[]): void {
    if (!query || query.trim().length < 3 || !results || results.length === 0) return;
    
    const key = this.getCacheKey(query);
    const normalizedQuery = this.normalizeQuery(query);
    
    // Save to all cache layers
    this.saveToMemoryCache(key, normalizedQuery, results);
    this.saveToSessionCache(key, normalizedQuery, results);
    this.saveToPersistentCache(key, normalizedQuery, results);
    
    console.log(`Cached results for "${query}": ${results.length} products`);
  }

  // Get cache statistics
  getStats(): CacheStats & { hitRate: number } {
    const hitRate = this.stats.totalSearches > 0 
      ? (this.stats.cacheHits / this.stats.totalSearches) * 100 
      : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  // Clear all caches
  clearAll(): void {
    this.memoryCache.clear();
    
    // Clear session storage
    const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('zinc_search_'));
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
    
    // Clear persistent storage
    const localKeys = Object.keys(localStorage).filter(key => key.startsWith('zinc_search_'));
    localKeys.forEach(key => localStorage.removeItem(key));
    
    // Reset stats
    this.stats = {
      totalSearches: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCallsSaved: 0,
      costSaved: 0
    };
    
    console.log('All search caches cleared');
  }
}

// Export singleton instance
export const searchCacheService = new SearchCacheService();
export type { CacheStats };
