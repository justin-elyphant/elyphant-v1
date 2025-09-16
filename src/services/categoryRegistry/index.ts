/**
 * Category Registry Module - Phase 1 Implementation
 * 
 * This module provides centralized category search management while maintaining
 * all existing protective measures and backward compatibility.
 */

export {
  CategorySearchRegistry,
  CATEGORY_SEARCH_REGISTRY,
  getCategorySearchQuery,
  isCategorySupported,
  type CategorySearchOptions,
  type CategorySearchStrategy,
  type CategoryKey
} from './CategorySearchRegistry';

export { CategorySearchService } from './CategorySearchService';

// Phase 1 Analytics placeholder for Phase 3 implementation
export const getCategoryPerformanceMetrics = () => {
  const { CategorySearchRegistry } = require('./CategorySearchRegistry');
  return CategorySearchRegistry.getSearchAnalytics();
};