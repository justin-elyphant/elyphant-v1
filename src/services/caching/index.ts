/**
 * Phase 2: Enhanced Caching Module - Exports
 * 
 * This module provides enhanced multi-layer caching capabilities while
 * maintaining all existing protective measures and backward compatibility
 * with Phase 1 Category Search Registry.
 */

export { EnhancedCacheService, type CacheEntry, type CacheWarmerConfig } from './EnhancedCacheService';
export { CachedCategorySearchService, type CachedCategorySearchOptions } from './CachedCategorySearchService';

// Convenience re-exports for easy integration  
export { EnhancedCacheService as CacheService } from './EnhancedCacheService';
export { CachedCategorySearchService as CachedSearchService } from './CachedCategorySearchService';