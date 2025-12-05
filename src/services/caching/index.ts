/**
 * Caching Module - Exports
 * 
 * Provides caching services for the marketplace.
 * Note: Primary caching is now server-side via the products table.
 */

export { EnhancedCacheService, type CacheEntry, type CacheWarmerConfig } from './EnhancedCacheService';

// Convenience re-exports for easy integration  
export { EnhancedCacheService as CacheService } from './EnhancedCacheService';
