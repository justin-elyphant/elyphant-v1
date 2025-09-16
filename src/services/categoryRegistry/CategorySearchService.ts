/**
 * Phase 1: Category Search Service
 * 
 * This service acts as the primary interface for the Category Search Registry
 * and will be used by UnifiedMarketplaceService to route category searches.
 * 
 * It maintains all existing protective measures while providing a clean
 * abstraction for category-based searches.
 */

import { CategorySearchRegistry, type CategorySearchOptions } from './CategorySearchRegistry';

export class CategorySearchService {
  /**
   * Execute a category search with full error handling and fallbacks
   */
  static async searchCategory(
    category: string,
    searchTerm: string = '',
    options: CategorySearchOptions = {}
  ) {
    console.log(`[CategorySearchService] Routing category search: ${category}`);
    
    try {
      const result = await CategorySearchRegistry.executeSearch(category, searchTerm, options);
      
      // Transform response to maintain compatibility with existing code
      if (result && 'results' in result) {
        return result.results;
      }
      
      return result;
      
    } catch (error) {
      console.error(`[CategorySearchService] Category search failed for: ${category}`, error);
      throw error;
    }
  }

  /**
   * Check if a category is supported by the registry
   */
  static isSupportedCategory(category: string): boolean {
    return CategorySearchRegistry.isCategorySupported(category);
  }

  /**
   * Get performance analytics for monitoring
   */
  static getAnalytics() {
    return CategorySearchRegistry.getSearchAnalytics();
  }
}

// Export for easy integration
export default CategorySearchService;