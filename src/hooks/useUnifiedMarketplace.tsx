
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Product } from "@/types/product";
import { unifiedMarketplaceService, SearchOptions, MarketplaceState } from "@/services/marketplace/UnifiedMarketplaceService";
import { extractBudgetFromNicoleContext } from "@/services/marketplace/nicoleContextUtils";
import { CategorySearchService } from "@/services/categoryRegistry/CategorySearchService";

interface UseUnifiedMarketplaceOptions {
  autoLoadOnMount?: boolean;
  defaultSearchTerm?: string;
}

export const useUnifiedMarketplace = (options: UseUnifiedMarketplaceOptions = {}) => {
  const { autoLoadOnMount = true, defaultSearchTerm = "" } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Unified state management
  const [state, setState] = useState<MarketplaceState>({
    products: [],
    isLoading: false,
    error: null,
    searchTerm: defaultSearchTerm,
    lastSearchId: "",
    hasMore: false,
    totalCount: 0
  });

  // Get URL parameters
  const urlSearchTerm = searchParams.get("search") || "";
  const category = searchParams.get("category");
  const luxuryCategories = searchParams.get("luxuryCategories") === "true";
  const giftsForHer = searchParams.get("giftsForHer") === "true";
  const giftsForHim = searchParams.get("giftsForHim") === "true";
  const giftsUnder50 = searchParams.get("giftsUnder50") === "true";
  const brandCategories = searchParams.get("brandCategories");
  const bestSellingCategory = category === "best-selling";
  const electronicsCategory = category === "electronics";
  const personId = searchParams.get("personId");
  const occasionType = searchParams.get("occasionType");

  /**
   * Update state with partial updates
   */
  const updateState = useCallback((updates: Partial<MarketplaceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Abort any ongoing requests
   */
  const abortCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Execute search with unified logic
   */
  const executeSearch = useCallback(async (
    searchTerm: string, 
    searchOptions: SearchOptions = {},
    isNewSearch: boolean = true
  ) => {
    // Abort any existing request
    abortCurrentRequest();
    
    const searchId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (isNewSearch) {
      updateState({
        isLoading: true,
        error: null,
        lastSearchId: searchId,
        searchTerm: searchTerm
      });
    }

    try {
      console.log(`[useUnifiedMarketplace] Starting search: "${searchTerm}", options:`, searchOptions);
      
      const results = await unifiedMarketplaceService.searchProducts(searchTerm, searchOptions);
      
      // Only update if this is still the current search
      if (state.lastSearchId === searchId || isNewSearch) {
        updateState({
          products: results,
          isLoading: false,
          error: null,
          totalCount: results.length,
          hasMore: false // For now, we don't implement pagination
        });
      }
      
      return results;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[useUnifiedMarketplace] Search aborted');
        return [];
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      console.error('[useUnifiedMarketplace] Search error:', errorMessage);
      
      updateState({
        isLoading: false,
        error: errorMessage,
        products: []
      });
      
      return [];
    }
  }, [abortCurrentRequest, updateState, state.lastSearchId]);

  // Removed the force refresh event listener that was causing infinite loops
  // The URL change detection in handleUrlSearch is sufficient

  /**
   * Handle search based on URL parameters
   */
  const handleUrlSearch = useCallback(() => {
    if (luxuryCategories) {
      console.log('[useUnifiedMarketplace] Detected luxury categories parameter');
      executeSearch("luxury collections", { luxuryCategories: true, maxResults: 20, silent: true });
    } else if (giftsForHer) {
      console.log('[useUnifiedMarketplace] Detected gifts for her parameter');
      executeSearch("gifts for her categories", { giftsForHer: true, maxResults: 20, silent: true });
    } else if (giftsForHim) {
      console.log('[useUnifiedMarketplace] Detected gifts for him parameter');
      executeSearch("gifts for him categories", { giftsForHim: true, maxResults: 20, silent: true });
    } else if (giftsUnder50) {
      console.log('[useUnifiedMarketplace] Detected gifts under $50 parameter');
      console.log('[useUnifiedMarketplace] URL params check:', { giftsUnder50, urlParam: searchParams.get("giftsUnder50") });
      executeSearch("gifts under $50 categories", { giftsUnder50: true, maxResults: 20, silent: true });
    } else if (bestSellingCategory) {
      console.log('[useUnifiedMarketplace] Detected best selling category parameter');
      executeSearch("category=best-selling", { bestSelling: true, maxResults: 20, silent: true });
    } else if (brandCategories) {
      console.log(`[useUnifiedMarketplace] Detected brand categories parameter: "${brandCategories}"`);
      executeSearch(brandCategories, { brandCategories: true, maxResults: 20, silent: true });
    } else if (category && CategorySearchService.isSupportedCategory(category)) {
      console.log(`[useUnifiedMarketplace] Detected supported category parameter: "${category}"`);
      updateState({ isLoading: true, error: null });
      (async () => {
        try {
          const results = await CategorySearchService.searchCategory(category, '', { limit: 20, silent: true });
          updateState({
            products: results || [],
            isLoading: false,
            error: null,
            totalCount: results?.length || 0,
            hasMore: false
          });
        } catch (err) {
          console.error('[useUnifiedMarketplace] Category registry search error:', err);
          updateState({ isLoading: false, error: 'Search failed', products: [] });
        }
      })();
    } else if (urlSearchTerm) {
      console.log(`[useUnifiedMarketplace] Detected URL search term: "${urlSearchTerm}"`);
      
      // Check for Nicole context in session storage for budget filtering
      let nicoleContext;
      try {
        const storedContext = sessionStorage.getItem('nicole-search-context');
        console.log('🔍 Checking session storage for Nicole context:', storedContext ? 'Found' : 'Not found');
        if (storedContext) {
          nicoleContext = JSON.parse(storedContext);
          console.log('💰 Retrieved Nicole context for URL search:', nicoleContext);
          console.log('💰 Budget from context:', nicoleContext.budget);
          // Clear after use to prevent stale data
          sessionStorage.removeItem('nicole-search-context');
        } else {
          console.log('ℹ️ No Nicole context found in session storage for search');
        }
      } catch (error) {
        console.warn('Failed to parse Nicole context from session storage:', error);
      }
      
      // Also extract explicit min/max price from URL params as a fallback
      const urlMinPrice = searchParams.get('minPrice');
      const urlMaxPrice = searchParams.get('maxPrice');
      const minPrice = urlMinPrice ? Number(urlMinPrice) : undefined;
      const maxPrice = urlMaxPrice ? Number(urlMaxPrice) : undefined;
      if (minPrice !== undefined || maxPrice !== undefined) {
        console.log('💰 URL provided price filters:', { minPrice, maxPrice });
      }
      
      executeSearch(urlSearchTerm, { 
        maxResults: 20,
        personId,
        occasionType,
        nicoleContext,
        silent: true, // Prevent toasts for URL-triggered searches
        // Ensure price filters are honored even without full context
        ...(minPrice !== undefined ? { minPrice } : {}),
        ...(maxPrice !== undefined ? { maxPrice } : {}),
      });
    } else if (autoLoadOnMount) {
      console.log('[useUnifiedMarketplace] Loading default products');
      executeSearch("", { maxResults: 20, silent: true });
    }
  }, [luxuryCategories, giftsForHer, giftsForHim, giftsUnder50, bestSellingCategory, electronicsCategory, brandCategories, urlSearchTerm, personId, occasionType, searchParams, executeSearch, autoLoadOnMount]);

  /**
   * Public search function for manual searches
   */
  const search = useCallback((searchTerm: string, options: SearchOptions = {}) => {
    // Update URL if this is a user-initiated search
    if (searchTerm.trim()) {
      const params = new URLSearchParams(searchParams);
      params.set("search", searchTerm);
      // Clear category and person-specific params for manual searches
      params.delete("luxuryCategories");
      params.delete("giftsForHer");
      params.delete("giftsForHim");
      params.delete("giftsUnder50");
      params.delete("brandCategories");
      params.delete("personId");
      params.delete("occasionType");
      setSearchParams(params);
    }
    
    return executeSearch(searchTerm, options);
  }, [executeSearch, searchParams, setSearchParams]);

  /**
   * Get product details
   */
  const getProductDetails = useCallback(async (productId: string) => {
    return unifiedMarketplaceService.getProductDetails(productId);
  }, []);

  /**
   * Clear current search
   */
  const clearSearch = useCallback(() => {
    abortCurrentRequest();
    updateState({
      products: [],
      searchTerm: "",
      error: null,
      isLoading: false
    });
    
    // Clear URL parameters
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.delete("luxuryCategories");
    params.delete("giftsForHer");
    params.delete("giftsForHim");
    params.delete("giftsUnder50");
    params.delete("brandCategories");
    params.delete("personId");
    params.delete("occasionType");
    setSearchParams(params);
  }, [abortCurrentRequest, updateState, searchParams, setSearchParams]);

  /**
   * Refresh current search
   */
  const refresh = useCallback(() => {
    if (state.searchTerm || luxuryCategories || giftsForHer || giftsForHim || giftsUnder50 || brandCategories) {
      // Call executeSearch directly instead of handleUrlSearch to avoid dependency issues
      if (luxuryCategories) {
        executeSearch("luxury collections", { luxuryCategories: true, maxResults: 20 });
      } else if (giftsForHer) {
        executeSearch("gifts for her categories", { giftsForHer: true, maxResults: 20 });
      } else if (giftsForHim) {
        executeSearch("gifts for him categories", { giftsForHim: true, maxResults: 20 });
      } else if (giftsUnder50) {
        executeSearch("gifts under $50 categories", { giftsUnder50: true, maxResults: 20 });
      } else if (brandCategories) {
        executeSearch(brandCategories, { brandCategories: true, maxResults: 20 });
      } else if (state.searchTerm) {
        executeSearch(state.searchTerm, { maxResults: 20 });
      }
    }
  }, [state.searchTerm, luxuryCategories, giftsForHer, giftsForHim, giftsUnder50, brandCategories, executeSearch]);

  // Handle URL parameter changes - use specific dependencies to avoid infinite loops
  useEffect(() => {
    handleUrlSearch();
  }, [urlSearchTerm, category, luxuryCategories, giftsForHer, giftsForHim, giftsUnder50, brandCategories, personId, occasionType]); // Trigger on category changes too

  // Check for marketplace refresh flag (set when user views product detail page)
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('marketplace-needs-refresh');
    if (needsRefresh === 'true') {
      sessionStorage.removeItem('marketplace-needs-refresh');
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        console.log('[useUnifiedMarketplace] Refreshing after product detail view');
        refresh();
      }, 100);
    }
  }, []); // Only check on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortCurrentRequest();
    };
  }, [abortCurrentRequest]);

  return {
    // State
    products: state.products,
    isLoading: state.isLoading,
    error: state.error,
    searchTerm: state.searchTerm,
    hasMore: state.hasMore,
    totalCount: state.totalCount,
    
    // URL state
    urlSearchTerm,
    luxuryCategories,
    giftsForHer,
    giftsForHim,
    giftsUnder50,
    brandCategories,
    personId,
    occasionType,
    
    // Actions
    search,
    clearSearch,
    refresh,
    getProductDetails,
    
    // Utilities
    cacheStats: unifiedMarketplaceService.getCacheStats()
  };
};
