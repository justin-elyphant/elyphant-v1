/**
 * useMarketplace - Simplified, URL-driven marketplace hook
 * 
 * Architecture: All filter state lives in URL, server handles ALL filtering/sorting
 * NO complex client-side routing or special case handlers
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productCatalogService, SearchOptions, SearchResponse } from '@/services/ProductCatalogService';

export interface UseMarketplaceOptions {
  autoLoadOnMount?: boolean;
  defaultLimit?: number;
}

export interface MarketplaceState {
  query: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: string;
  brands: string[];
}

/**
 * Extract all marketplace state from URL parameters
 */
const extractStateFromURL = (searchParams: URLSearchParams): MarketplaceState => {
  return {
    query: searchParams.get('search') || '',
    category: searchParams.get('category'),
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
    sortBy: searchParams.get('sortBy') || 'popularity',
    brands: searchParams.get('brands')?.split(',').filter(Boolean) || [],
  };
};

/**
 * Convert URL state to search options for the service
 */
const stateToSearchOptions = (state: MarketplaceState, limit: number): SearchOptions => {
  const options: SearchOptions = {
    page: 1,
    limit,
    filters: {},
  };

  if (state.category) {
    options.category = state.category;
  }

  if (state.minPrice !== null) {
    options.filters!.minPrice = state.minPrice;
  }
  if (state.maxPrice !== null) {
    options.filters!.maxPrice = state.maxPrice;
  }
  if (state.sortBy) {
    options.filters!.sortBy = state.sortBy as any;
  }
  if (state.brands.length > 0) {
    options.filters!.brands = state.brands;
  }

  return options;
};

export const useMarketplace = (options: UseMarketplaceOptions = {}) => {
  const { autoLoadOnMount = true, defaultLimit = 20 } = options;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const hasInitialized = useRef(false);

  // Extract state from URL - single source of truth
  const urlState = useMemo(() => extractStateFromURL(searchParams), [searchParams]);

  // Determine if we should fetch (have query or category)
  const shouldFetch = useMemo(() => {
    const hasQuery = urlState.query.length > 0;
    const hasCategory = urlState.category !== null;
    
    return hasQuery || hasCategory || autoLoadOnMount;
  }, [urlState, autoLoadOnMount]);

  // Generate query key for React Query caching
  const queryKey = useMemo(() => ['marketplace', urlState], [urlState]);

  // Single API call - server handles ALL filtering, sorting, caching
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useQuery<SearchResponse>({
    queryKey,
    queryFn: async () => {
      const searchOptions = stateToSearchOptions(urlState, defaultLimit);
      console.log('[useMarketplace] Fetching with options:', searchOptions);
      return productCatalogService.searchProducts(urlState.query, searchOptions);
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes - server cache is the authority
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Handle marketplace refresh from product detail navigation
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('marketplace-needs-refresh');
    if (needsRefresh === 'true') {
      sessionStorage.removeItem('marketplace-needs-refresh');
      refetch();
    }
  }, [location.pathname, refetch]);

  /**
   * Search function - updates URL, which triggers new fetch
   */
  const search = useCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    
    // Clear category when doing a new search
    params.delete('category');
    
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  /**
   * Update filters - updates URL
   */
  const updateFilters = useCallback((filters: Partial<MarketplaceState>) => {
    const params = new URLSearchParams(searchParams);
    
    if (filters.minPrice !== undefined) {
      filters.minPrice ? params.set('minPrice', String(filters.minPrice)) : params.delete('minPrice');
    }
    if (filters.maxPrice !== undefined) {
      filters.maxPrice ? params.set('maxPrice', String(filters.maxPrice)) : params.delete('maxPrice');
    }
    if (filters.sortBy !== undefined) {
      params.set('sortBy', filters.sortBy);
    }
    if (filters.brands !== undefined) {
      filters.brands.length > 0 ? params.set('brands', filters.brands.join(',')) : params.delete('brands');
    }
    if (filters.category !== undefined) {
      filters.category ? params.set('category', filters.category) : params.delete('category');
    }
    
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  /**
   * Clear all search state
   */
  const clearSearch = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  /**
   * Manual search execution (bypasses URL for programmatic use)
   */
  const executeSearch = useCallback(async (
    query: string, 
    searchOptions: Partial<SearchOptions> = {}
  ): Promise<SearchResponse> => {
    const options = stateToSearchOptions(urlState, defaultLimit);
    return productCatalogService.searchProducts(query, { ...options, ...searchOptions });
  }, [urlState, defaultLimit]);

  return {
    // Products
    products: data?.products || [],
    totalCount: data?.totalCount || 0,
    
    // Loading states
    isLoading: isLoading || isFetching,
    error: error?.message || data?.error,
    
    // URL state (read-only)
    urlState,
    searchTerm: urlState.query,
    
    // Cache stats from server
    cacheStats: data?.cacheStats,
    facets: data?.facets,
    
    // Actions
    search,
    updateFilters,
    clearSearch,
    executeSearch,
    refetch,
  };
};

export default useMarketplace;
