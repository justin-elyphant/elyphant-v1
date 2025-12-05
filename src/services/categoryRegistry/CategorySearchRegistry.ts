/**
 * CategorySearchRegistry - Compatibility stub
 * @deprecated Use ProductCatalogService directly instead
 */

export interface CategorySearchOptions {
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  maxResults?: number;
  warmCache?: boolean;
  skipCache?: boolean;
  page?: number;
}

export interface CategoryConfig {
  displayName: string;
  searchTerms: string[];
  defaultFilters?: any;
}

/**
 * Stub registry class for backward compatibility
 */
export class CategorySearchRegistry {
  private static categories: Map<string, CategoryConfig> = new Map();

  static registerCategory(_key: string, _config: CategoryConfig): void {
    // Stub - no-op
  }

  static getCategory(key: string): CategoryConfig | undefined {
    return this.categories.get(key);
  }

  static searchCategory(_category: string, _options: CategorySearchOptions = {}): Promise<any[]> {
    console.warn('CategorySearchRegistry is deprecated. Use ProductCatalogService instead.');
    return Promise.resolve([]);
  }

  static getCategoryProducts(_category: string, _options: CategorySearchOptions = {}): Promise<any[]> {
    console.warn('CategorySearchRegistry is deprecated. Use ProductCatalogService instead.');
    return Promise.resolve([]);
  }
}

export default CategorySearchRegistry;
