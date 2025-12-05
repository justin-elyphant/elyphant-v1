/**
 * useUnifiedSearch - Compatibility wrapper
 * @deprecated Use useMarketplace instead
 */

import { useState, useCallback } from "react";
import { productCatalogService } from "@/services/ProductCatalogService";
import { Product } from "@/types/product";

interface UseUnifiedSearchOptions {
  debounceMs?: number;
  defaultQuery?: string;
  maxResults?: number;
  autoSearch?: boolean;
}

interface SearchCallOptions {
  maxResults?: number;
  includeFriends?: boolean;
  includeProducts?: boolean;
  includeBrands?: boolean;
  currentUserId?: string;
  [key: string]: any;
}

export const useUnifiedSearch = (_options: UseUnifiedSearchOptions = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const searchProducts = useCallback(async (query: string, _options?: SearchCallOptions): Promise<Product[]> => {
    if (!query.trim()) {
      setProducts([]);
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await productCatalogService.searchProducts(query);
      const results = response.products || [];
      setProducts(results);
      setSearchTerm(query);
      
      // Add to search history
      setSearchHistory(prev => {
        const filtered = prev.filter(h => h !== query);
        return [query, ...filtered].slice(0, 10);
      });
      
      return results;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Search failed";
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Accepts optional second argument for backward compatibility
  const search = useCallback(async (term: string, _options?: SearchCallOptions): Promise<void> => {
    await searchProducts(term, _options);
  }, [searchProducts]);

  const setQuery = useCallback((query: string) => {
    setSearchTerm(query);
  }, []);

  const clearSearch = useCallback(() => {
    setProducts([]);
    setSearchTerm("");
    setError(null);
  }, []);

  const cacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    cacheSize: 0,
    activeRequests: 0
  };

  return {
    // Primary interface
    searchResults: products,
    results: {
      products,
      friends: [],
      brands: [],
      total: products.length
    },
    searchProducts,
    products,
    
    // Loading states
    isSearching: isLoading,
    isLoading,
    
    // Error handling
    searchError: error,
    error,
    
    // Search state
    searchTerm,
    query: searchTerm,
    
    // Actions
    executeSearch: search,
    search,
    clearResults: clearSearch,
    clearSearch,
    
    // Additional properties expected by consumers
    searchHistory,
    setQuery,
    cacheStats,
  };
};

export default useUnifiedSearch;
