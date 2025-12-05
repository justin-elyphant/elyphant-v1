/**
 * useEnhancedCategorySearch - Compatibility stub
 * @deprecated Use useMarketplace with category option instead
 */

import { useState, useCallback } from "react";
import { productCatalogService } from "@/services/ProductCatalogService";

export interface CategorySearchOptions {
  page?: number;
  limit?: number;
  maxResults?: number;
  minPrice?: number;
  maxPrice?: number;
  warmCache?: boolean;
}

export const useEnhancedCategorySearch = () => {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchCategory = useCallback(async (
    category: string, 
    query: string = '', 
    options: CategorySearchOptions = {}
  ): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await productCatalogService.searchProducts(query || category, {
        category,
        page: options.page || 1,
        limit: options.limit || options.maxResults || 20,
        filters: {
          minPrice: options.minPrice,
          maxPrice: options.maxPrice,
        }
      });
      
      const products = response.products || [];
      setResults(products);
      return products;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchCategoryProducts = useCallback(async (
    category: string, 
    query: string = '',
    options: CategorySearchOptions = {}
  ): Promise<any[]> => {
    return searchCategory(category, query, options);
  }, [searchCategory]);
  
  return {
    results,
    isLoading,
    error,
    searchCategory,
    searchCategoryProducts,
  };
};

export default useEnhancedCategorySearch;
