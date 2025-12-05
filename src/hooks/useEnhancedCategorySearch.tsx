/**
 * useEnhancedCategorySearch - Compatibility stub
 * @deprecated Use useMarketplace with category option instead
 */

import { useState, useCallback } from "react";
import { productCatalogService } from "@/services/ProductCatalogService";

export const useEnhancedCategorySearch = () => {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchCategory = useCallback(async (category: string, query: string = '', options: any = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await productCatalogService.searchProducts(query, {
        category,
        page: options.page || 1,
        limit: options.limit || 20,
        filters: {
          minPrice: options.minPrice,
          maxPrice: options.maxPrice,
        }
      });
      
      setResults(response.products);
      return response.products;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    results,
    isLoading,
    error,
    searchCategory,
  };
};

export default useEnhancedCategorySearch;
