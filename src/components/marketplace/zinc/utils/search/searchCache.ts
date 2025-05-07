
/**
 * Cache implementation for search results to improve performance
 */

import { ZincProduct } from '../../types';

// Use a more robust key format to avoid conflicts
const formatCacheKey = (query: string): string => {
  return query.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Cache to store recently searched products to improve performance
 */
export const searchCache: Record<string, { timestamp: number, results: ZincProduct[] }> = {};

/**
 * The cache expiry time in milliseconds (5 minutes)
 */
export const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Cleans up old cache entries
 */
export const cleanupCache = (): void => {
  try {
    const now = Date.now();
    let cleanedCount = 0;
    
    Object.keys(searchCache).forEach(key => {
      if (now - searchCache[key].timestamp > CACHE_EXPIRY) {
        delete searchCache[key];
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`Cache: Cleaned up ${cleanedCount} expired entries`);
    }
  } catch (err) {
    console.error("Error cleaning up cache:", err);
  }
};

/**
 * Get search results from cache if available and not expired
 * @param query The search query
 * @returns The cached results or null if not in cache or expired
 */
export const getFromCache = (query: string): ZincProduct[] | null => {
  try {
    if (!query || query.trim() === '') return null;
    
    const cacheKey = formatCacheKey(query);
    
    if (searchCache[cacheKey] && 
        Date.now() - searchCache[cacheKey].timestamp < CACHE_EXPIRY) {
      console.log(`Cache: Using cached results for "${query}" (${searchCache[cacheKey].results.length} items)`);
      return searchCache[cacheKey].results;
    }
    
    console.log(`Cache: No valid cache found for "${query}"`);
    return null;
  } catch (err) {
    console.error("Error retrieving from cache:", err);
    return null;
  }
};

/**
 * Save search results to cache
 * @param query The search query
 * @param results The search results to cache
 */
export const saveToCache = (query: string, results: ZincProduct[]): void => {
  try {
    if (!query || query.trim() === '') return;
    if (!results || !Array.isArray(results)) return;
    
    const cacheKey = formatCacheKey(query);
    
    console.log(`Cache: Saving ${results.length} results for "${query}"`);
    searchCache[cacheKey] = {
      timestamp: Date.now(),
      results: results.slice(0, 50) // Limit cache size for better performance
    };
  } catch (err) {
    console.error("Error saving to cache:", err);
  }
};
