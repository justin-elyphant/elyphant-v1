import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Product } from "@/types/product";
import { handleSearch, handleMultiInterestSearch, clearSearchOperations } from "./utils/searchOperations";
import { loadPersonalizedProducts } from "./utils/personalizationUtils";
import { createBoundedMemoization } from "@/utils/performanceOptimizations";

// Create bounded memoization for expensive operations
const memoizedParamExtraction = createBoundedMemoization((searchParams: URLSearchParams) => {
  return {
    searchParam: searchParams.get("search"),
    personId: searchParams.get("personId"),
    occasionType: searchParams.get("occasionType"),
    multiInterest: searchParams.get("multi_interest"),
    minPrice: searchParams.get("minPrice"),
    maxPrice: searchParams.get("maxPrice"),
    source: searchParams.get("source"),
    recipient: searchParams.get("recipient"),
    occasion: searchParams.get("occasion")
  };
}, 20);

export const useOptimizedMarketplaceProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { profile } = useProfile();
  const searchIdRef = useRef<string>("");
  const lastSearchTermRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Memoized user interests
  const userInterests = useMemo(() => {
    const interests = profile?.gift_preferences || [];
    return Array.isArray(interests) 
      ? interests.map(pref => typeof pref === 'string' ? pref : pref.category)
      : [];
  }, [profile?.gift_preferences]);

  // Optimized search function with debouncing and cancellation
  const performSearch = useCallback(async (
    searchParam: string,
    params: any,
    searchId: string
  ) => {
    // Cancel previous search if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    // Clear any pending timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Build Nicole context if available
        const nicoleContext = params.source === 'nicole' ? {
          minPrice: params.minPrice ? Number(params.minPrice) : undefined,
          maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
          recipient: params.recipient,
          occasion: params.occasion,
          budget: (params.minPrice && params.maxPrice) ? 
            [Number(params.minPrice), Number(params.maxPrice)] : undefined
        } : undefined;

        // Check if this is a multi-interest search
        if (params.multiInterest === 'true') {
          const interests = searchParam.split(' ').filter(term => term.length > 0);
          console.log('🎯 Optimized: Multi-interest search for:', interests);
          await handleMultiInterestSearch(interests, searchIdRef, setIsLoading, setProducts);
        } else {
          await handleSearch(
            searchParam, 
            searchIdRef, 
            setIsLoading, 
            setProducts, 
            params.personId, 
            params.occasionType, 
            false, 
            nicoleContext
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search error:', error);
        }
      }
    }, 300); // 300ms debounce
  }, []);

  // Optimized parameter extraction and search triggering
  const extractedParams = useMemo(() => 
    memoizedParamExtraction(searchParams), 
    [searchParams]
  );

  // Initial load effect - consolidated and optimized
  useEffect(() => {
    const { searchParam } = extractedParams;
    
    if (searchParam && searchParam !== lastSearchTermRef.current) {
      lastSearchTermRef.current = searchParam;
      setSearchTerm(searchParam);
      
      console.log('🎯 Optimized: URL parameters received:', extractedParams);
      
      // Generate unique ID for this search
      const searchId = `search-${searchParam}-${Date.now()}`;
      searchIdRef.current = searchId;
      
      performSearch(searchParam, extractedParams, searchId);
    } else if (!searchParam && products.length === 0) {
      // Load personalized products only if no search and no products
      console.log('🎯 Optimized: Loading personalized products');
      loadPersonalizedProducts(userInterests, setIsLoading, setProducts, products.length);
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      clearSearchOperations();
    };
  }, [extractedParams, performSearch, userInterests, products.length]);

  // Optimized search submission handler
  const onSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    
    // Cancel any pending operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Update URL parameter
    const params = new URLSearchParams(searchParams);
    params.set("search", term);
    // Clear context parameters for manual search
    ["personId", "occasionType", "source", "minPrice", "maxPrice", "recipient", "occasion"].forEach(
      param => params.delete(param)
    );
    setSearchParams(params);
    
    // Generate unique ID for this search
    const searchId = `search-${term}-${Date.now()}`;
    searchIdRef.current = searchId;
    lastSearchTermRef.current = term;
    
    // Directly handle search
    handleSearch(term, searchIdRef, setIsLoading, setProducts, null, null);
  }, [searchParams, setSearchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return { 
    searchTerm, 
    setSearchTerm, 
    isLoading, 
    products,
    onSearch
  };
};