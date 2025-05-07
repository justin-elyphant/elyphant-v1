
/**
 * Simple cache implementation for mock search results to improve performance
 */

import { ZincProduct } from '../../types';

// Use a more robust key format to avoid conflicts
const formatCacheKey = (query: string): string => {
  if (!query || typeof query !== 'string') return '';
  return query.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Cache to store recently searched products
 */
export const searchCache: Record<string, { timestamp: number, results: ZincProduct[] }> = {};

/**
 * The cache expiry time in milliseconds (5 minutes)
 */
export const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Maximum number of entries to keep in cache
 */
export const MAX_CACHE_ENTRIES = 10;

/**
 * Maximum number of products to store per cache entry
 */
export const MAX_PRODUCTS_PER_ENTRY = 20;

/**
 * Cleans up old cache entries
 */
export const cleanupCache = (): void => {
  const now = Date.now();
  
  // First remove expired entries
  Object.keys(searchCache).forEach(key => {
    if (now - searchCache[key].timestamp > CACHE_EXPIRY) {
      delete searchCache[key];
    }
  });
  
  // Then limit total number of entries if there are too many
  if (Object.keys(searchCache).length > MAX_CACHE_ENTRIES) {
    // Sort by timestamp (oldest first)
    const sortedKeys = Object.keys(searchCache).sort((a, b) => 
      searchCache[a].timestamp - searchCache[b].timestamp
    );
    
    // Remove oldest entries to get down to the limit
    const keysToRemove = sortedKeys.slice(0, sortedKeys.length - MAX_CACHE_ENTRIES);
    keysToRemove.forEach(key => {
      delete searchCache[key];
    });
  }
};

/**
 * Get search results from cache if available and not expired
 * @param query The search query
 * @returns The cached results or null if not in cache or expired
 */
export const getFromCache = (query: string): ZincProduct[] | null => {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return null;
  }
  
  const cacheKey = formatCacheKey(query);
  if (!cacheKey) return null;
  
  if (searchCache[cacheKey] && 
      Date.now() - searchCache[cacheKey].timestamp < CACHE_EXPIRY) {
    return searchCache[cacheKey].results;
  }
  
  return null;
};

/**
 * Save search results to cache
 * @param query The search query
 * @param results The search results to cache
 */
export const saveToCache = (query: string, results: ZincProduct[]): void => {
  if (!query || typeof query !== 'string' || query.trim() === '') return;
  if (!results || !Array.isArray(results)) return;
  
  // Clean up cache periodically
  if (Math.random() < 0.1) {
    cleanupCache();
  }
  
  const cacheKey = formatCacheKey(query);
  if (!cacheKey) return;
  
  // Limit the number of products per cache entry
  const limitedResults = results.slice(0, MAX_PRODUCTS_PER_ENTRY);
  
  // Create a defensive copy to avoid reference sharing issues
  const safeCopy = limitedResults.map(product => ({...product}));
  
  searchCache[cacheKey] = {
    timestamp: Date.now(),
    results: safeCopy
  };
};
