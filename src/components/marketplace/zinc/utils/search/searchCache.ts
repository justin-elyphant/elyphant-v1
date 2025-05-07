
/**
 * Cache implementation for search results to improve performance
 */

import { ZincProduct } from '../../types';

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
  const now = Date.now();
  Object.keys(searchCache).forEach(key => {
    if (now - searchCache[key].timestamp > CACHE_EXPIRY) {
      delete searchCache[key];
    }
  });
};

/**
 * Get search results from cache if available and not expired
 * @param query The search query
 * @returns The cached results or null if not in cache or expired
 */
export const getFromCache = (query: string): ZincProduct[] | null => {
  const lowercaseQuery = query.toLowerCase().trim();
  
  if (searchCache[lowercaseQuery] && 
      Date.now() - searchCache[lowercaseQuery].timestamp < CACHE_EXPIRY) {
    console.log(`Using cached results for "${lowercaseQuery}"`);
    return searchCache[lowercaseQuery].results;
  }
  
  return null;
};

/**
 * Save search results to cache
 * @param query The search query
 * @param results The search results to cache
 */
export const saveToCache = (query: string, results: ZincProduct[]): void => {
  const lowercaseQuery = query.toLowerCase().trim();
  
  searchCache[lowercaseQuery] = {
    timestamp: Date.now(),
    results
  };
};
