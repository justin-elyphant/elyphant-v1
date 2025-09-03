import { useState, useCallback, useRef, useEffect } from "react";
import { unifiedSearch, UnifiedSearchResults, SearchOptions } from "@/services/search/unifiedSearchService";
import { unifiedMarketplaceService } from "@/services/marketplace/UnifiedMarketplaceService";
import { Product } from "@/types/product";
import { toast } from "sonner";

export interface UnifiedSearchState {
  query: string;
  results: UnifiedSearchResults;
  isLoading: boolean;
  error: string | null;
  searchHistory: string[];
}

interface UseUnifiedSearchOptions {
  defaultQuery?: string;
  autoSearch?: boolean;
  debounceMs?: number;
  maxResults?: number;
}

export const useUnifiedSearch = (options: UseUnifiedSearchOptions = {}) => {
  const {
    defaultQuery = "",
    autoSearch = false,
    debounceMs = 300,
    maxResults = 20
  } = options;

  // State management
  const [state, setState] = useState<UnifiedSearchState>({
    query: defaultQuery,
    results: { friends: [], products: [], brands: [], total: 0 },
    isLoading: false,
    error: null,
    searchHistory: []
  });

  // Refs for cleanup and debouncing
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchIdRef = useRef<string>("");

  /**
   * Update state with partial updates
   */
  const updateState = useCallback((updates: Partial<UnifiedSearchState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Abort any ongoing search
   */
  const abortCurrentSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  /**
   * Execute search with proper error handling and caching
   */
  const executeSearch = useCallback(async (
    query: string,
    searchOptions: SearchOptions = {}
  ): Promise<UnifiedSearchResults> => {
    // Generate unique search ID
    const searchId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    lastSearchIdRef.current = searchId;

    // Abort any existing search
    abortCurrentSearch();

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Update state to loading
    updateState({
      isLoading: true,
      error: null,
      query: query
    });

    try {
      console.log(`[useUnifiedSearch] Starting search: "${query}", options:`, searchOptions);

      // Perform unified search
      const results = await unifiedSearch(query, {
        maxResults,
        ...searchOptions
      });

      // Check if this is still the current search
      if (lastSearchIdRef.current === searchId && !abortControllerRef.current?.signal.aborted) {
        // Update search history
        const newHistory = [query, ...state.searchHistory.filter(h => h !== query)].slice(0, 10);

        updateState({
          results,
          isLoading: false,
          error: null,
          searchHistory: newHistory
        });

        // Silently show search results - no toast needed for normal searches
        if (results.total > 0 && query.trim()) {
          console.log(`Found ${results.total} results: ${results.friends.length} friends, ${results.products.length} products, ${results.brands.length} brands`);
        }
      }

      return results;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[useUnifiedSearch] Search aborted');
        return { friends: [], products: [], brands: [], total: 0 };
      }

      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      console.error('[useUnifiedSearch] Search error:', errorMessage);

      // Only update if this is still the current search
      if (lastSearchIdRef.current === searchId) {
        updateState({
          isLoading: false,
          error: errorMessage,
          results: { friends: [], products: [], brands: [], total: 0 }
        });

        toast.error('Search failed', {
          description: errorMessage
        });
      }

      return { friends: [], products: [], brands: [], total: 0 };
    } finally {
      // Clean up abort controller
      if (abortControllerRef.current && lastSearchIdRef.current === searchId) {
        abortControllerRef.current = null;
      }
    }
  }, [abortCurrentSearch, updateState, maxResults, state.searchHistory]);

  /**
   * Debounced search function
   */
  const search = useCallback((query: string, searchOptions: SearchOptions = {}) => {
    // Clear existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // If query is empty, clear results immediately
    if (!query.trim()) {
      updateState({
        query: "",
        results: { friends: [], products: [], brands: [], total: 0 },
        isLoading: false,
        error: null
      });
      return Promise.resolve({ friends: [], products: [], brands: [], total: 0 });
    }

    // Set up debounced search
    return new Promise<UnifiedSearchResults>((resolve) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        const results = await executeSearch(query, searchOptions);
        resolve(results);
      }, debounceMs);
    });
  }, [executeSearch, updateState, debounceMs]);

  /**
   * Immediate search without debouncing
   */
  const searchImmediate = useCallback((query: string, searchOptions: SearchOptions = {}) => {
    return executeSearch(query, searchOptions);
  }, [executeSearch]);

  /**
   * Search only products (marketplace-focused)
   */
  const searchProducts = useCallback(async (query: string, searchOptions: SearchOptions = {}): Promise<Product[]> => {
    try {
      const results = await unifiedMarketplaceService.searchProducts(query, {
        maxResults,
        ...searchOptions
      });
      return results;
    } catch (error) {
      console.error('[useUnifiedSearch] Product search error:', error);
      toast.error('Product search failed');
      return [];
    }
  }, [maxResults]);

  /**
   * Clear search and results
   */
  const clearSearch = useCallback(() => {
    abortCurrentSearch();
    updateState({
      query: "",
      results: { friends: [], products: [], brands: [], total: 0 },
      isLoading: false,
      error: null
    });
  }, [abortCurrentSearch, updateState]);

  /**
   * Set query without triggering search
   */
  const setQuery = useCallback((query: string) => {
    updateState({ query });
  }, [updateState]);

  // Auto-search effect
  useEffect(() => {
    if (autoSearch && state.query.length >= 2) {
      search(state.query);
    }
  }, [state.query, autoSearch, search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortCurrentSearch();
    };
  }, [abortCurrentSearch]);

  return {
    // State
    query: state.query,
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,
    searchHistory: state.searchHistory,

    // Actions
    search,
    searchImmediate,  
    searchProducts,
    setQuery,
    clearSearch,

    // Utilities
    cacheStats: unifiedMarketplaceService.getCacheStats()
  };
};