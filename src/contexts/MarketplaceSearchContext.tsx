/**
 * Unified Marketplace Search Context
 * Single source of truth for all marketplace search operations
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useAdvancedFilters } from "@/hooks/useAdvancedFilters";
import { productCatalogService } from "@/services/ProductCatalogService";
import { debouncedToastSuccess, debouncedToastError, debouncedToastInfo } from "@/utils/toastDeduplication";

interface MarketplaceSearchContextType {
  // Search state
  searchTerm: string;
  debouncedSearchTerm: string;
  isSearching: boolean;
  isLoading: boolean;
  error: string | null;
  setSearchTerm: (term: string) => void;
  
  // Filter state
  filters: any;
  filteredProducts: any[];
  availableCategories: string[];
  activeFilterCount: number;
  updateFilters: (updates: any) => void;
  clearFilters: () => void;
  
  // Actions
  handleRetrySearch: () => void;
  clearCache: () => void;
  loadDefaultProducts: () => void;
}

const MarketplaceSearchContext = createContext<MarketplaceSearchContextType | undefined>(undefined);

interface MarketplaceSearchProviderProps {
  children: ReactNode;
  currentPage?: number;
}

export const MarketplaceSearchProvider: React.FC<MarketplaceSearchProviderProps> = ({ 
  children, 
  currentPage = 1 
}) => {
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRequestRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSearchingRef = useRef(false);
  const lastSearchIdRef = useRef<string>("");
  
  // Get search term from URL
  const searchParams = new URLSearchParams(location.search);
  let urlSearchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  const brandCategoriesParam = searchParams.get("brandCategories");
  
  if (categoryParam) urlSearchTerm = "category=" + categoryParam;
  if (brandCategoriesParam) urlSearchTerm = "brandCategories=" + brandCategoriesParam;
  
  // Use debounced search
  const {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    setSearchTerm
  } = useDebounceSearch({ 
    initialValue: urlSearchTerm,
    delay: 300 
  });

  // Use advanced filters
  const {
    filters,
    filteredProducts,
    availableCategories,
    activeFilterCount,
    updateFilters,
    clearFilters
  } = useAdvancedFilters(products);

  // Update search term when URL changes
  useEffect(() => {
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [urlSearchTerm, searchTerm, setSearchTerm]);

  // Load default products on initial load and perform search when there's a search term
  useEffect(() => {
    if (isSearchingRef.current) {
      return;
    }

    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm, currentPage);
    } else {
      loadDefaultProducts();
    }
  }, [debouncedSearchTerm, currentPage]);

  const performSearch = async (query: string, page: number) => {
    // Create unique search ID to prevent duplicates
    const searchId = `${query}-${page}-${Date.now()}`;
    
    // Prevent duplicate searches with same parameters
    if (lastSearchIdRef.current === `${query}-${page}`) {
      console.log('Duplicate search prevented:', query);
      return;
    }
    
    // Prevent concurrent searches
    if (isSearchingRef.current) {
      console.log('Search already in progress, skipping');
      return;
    }

    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    searchRequestRef.current = searchId;
    lastSearchIdRef.current = `${query}-${page}`;

    isSearchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[MarketplaceSearchContext] Enhanced search for: "${query}" (page ${page})`);
      
      const searchResult = await enhancedZincApiService.searchProducts(query, page, 50);
      
      // Check if this search is still current
      if (searchRequestRef.current !== searchId || abortControllerRef.current?.signal.aborted) {
        console.log('Search cancelled or superseded');
        return;
      }
      
      if (searchResult.error && !searchResult.cached) {
        throw new Error(searchResult.error);
      }
      
      if (searchResult.results && searchResult.results.length > 0) {
        // Convert to Product format and update context
        const normalizedProducts = searchResult.results.map(result => ({
          id: result.product_id,
          product_id: result.product_id,
          name: result.title,
          title: result.title,
          price: result.price,
          category: result.category,
          image: result.image,
          vendor: result.retailer || "Amazon via Zinc",
          description: result.description,
          rating: result.stars,
          reviewCount: result.num_reviews
        }));

        console.log("[MarketplaceSearchContext] Normalized products: ", normalizedProducts.length);
        
        // Update products context
        setProducts(prev => {
          const nonZincProducts = prev.filter(p => 
            p.vendor !== "Amazon via Zinc" && 
            p.vendor !== "Elyphant"
          );
          return [...nonZincProducts, ...normalizedProducts];
        });
        
        // Only show success toast for new searches, not page changes
        if (page === 1) {
          const description = searchResult.cached 
            ? `Found ${searchResult.results.length} cached results for "${query}"`
            : `Found ${searchResult.results.length} results for "${query}"`;
          console.log(`Search completed: ${description}`);
        }
      } else if (page === 1) {
        debouncedToastInfo("No results found", {
          description: `No products found matching "${query}"`
        });
      }
      
    } catch (err) {
      // Only show error if this search is still current
      if (searchRequestRef.current === searchId && !abortControllerRef.current?.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : "Search failed";
        setError(errorMessage);
        
        debouncedToastError("Search error", {
          description: errorMessage,
          action: {
            label: "Retry",
            onClick: () => performSearch(query, page)
          }
        });
      }
    } finally {
      // Only update loading state if this search is still current
      if (searchRequestRef.current === searchId) {
        setIsLoading(false);
        isSearchingRef.current = false;
      }
    }
  };

  const handleRetrySearch = () => {
    if (debouncedSearchTerm) {
      lastSearchIdRef.current = ""; // Reset to allow retry
      performSearch(debouncedSearchTerm, currentPage);
    }
  };

  const loadDefaultProducts = async () => {
    if (isSearchingRef.current) {
      console.log('Search already in progress, skipping default products load');
      return;
    }

    isSearchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[MarketplaceSearchContext] Loading default marketplace products...');
      
      const defaultResult = await enhancedZincApiService.getDefaultProducts(50);
      
      if (defaultResult.error && !defaultResult.cached) {
        throw new Error(defaultResult.error);
      }
      
      if (defaultResult.results && defaultResult.results.length > 0) {
        // Convert to Product format and update context
        const normalizedProducts = defaultResult.results.map(result => ({
          id: result.product_id,
          product_id: result.product_id,
          name: result.title,
          title: result.title,
          price: result.price,
          category: result.category,
          image: result.image,
          vendor: result.retailer || "Amazon via Zinc",
          description: result.description,
          rating: result.stars,
          reviewCount: result.num_reviews
        }));

        console.log("[MarketplaceSearchContext] Loaded default products: ", normalizedProducts.length);
        
        // Update products context with default products
        setProducts(normalizedProducts);
        
        // Silently load marketplace - no toast needed for normal operation
        console.log(`[MarketplaceSearchContext] Loaded default products: ${normalizedProducts.length}`);
      } else {
        console.log("No default products found");
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products";
      setError(errorMessage);
      
      debouncedToastError("Error loading marketplace", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => loadDefaultProducts()
        }
      });
    } finally {
      setIsLoading(false);
      isSearchingRef.current = false;
    }
  };

  const clearCache = () => {
    enhancedZincApiService.clearCache();
    debouncedToastSuccess("Search cache cleared");
    lastSearchIdRef.current = ""; // Reset to allow fresh search
    // Force refresh after clearing cache
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm, currentPage);
    } else {
      loadDefaultProducts();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isSearchingRef.current = false;
    };
  }, []);

  const contextValue: MarketplaceSearchContextType = {
    searchTerm,
    debouncedSearchTerm,
    isSearching: isSearching || isLoading,
    isLoading,
    error,
    setSearchTerm,
    filters,
    filteredProducts,
    availableCategories,
    activeFilterCount,
    updateFilters,
    clearFilters,
    handleRetrySearch,
    clearCache,
    loadDefaultProducts
  };

  return (
    <MarketplaceSearchContext.Provider value={contextValue}>
      {children}
    </MarketplaceSearchContext.Provider>
  );
};

export const useMarketplaceSearch = (): MarketplaceSearchContextType => {
  const context = useContext(MarketplaceSearchContext);
  if (context === undefined) {
    throw new Error("useMarketplaceSearch must be used within a MarketplaceSearchProvider");
  }
  return context;
};