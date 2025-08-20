
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useAdvancedFilters } from "@/hooks/useAdvancedFilters";
import { enhancedZincApiService, ZincSearchResponse } from "@/services/enhancedZincApiService";
import { toast } from "sonner";

export const useEnhancedMarketplaceSearch = (currentPage: number) => {
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRequestRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSearchingRef = useRef(false);
  
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
      // Perform search when there's a search term
      performSearch(debouncedSearchTerm, currentPage);
    } else {
      // Load default products when there's no search term
      loadDefaultProducts();
    }
  }, [debouncedSearchTerm, currentPage]);

  const performSearch = async (query: string, page: number) => {
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
    const searchId = `${query}-${page}-${Date.now()}`;
    searchRequestRef.current = searchId;

    isSearchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Enhanced search for: "${query}" (page ${page})`);
      
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
        // Debug: Log actual prices from API
        console.log('🔍 Frontend price debugging - First 3 results from API:');
        searchResult.results.slice(0, 3).forEach((result, index) => {
          console.log(`Result ${index + 1}: "${result.title}" - API Price: ${result.price} (type: ${typeof result.price})`);
        });

        // Convert to Product format and update context
        const normalizedProducts = searchResult.results.map(result => {
          console.log(`🔍 Processing product: "${result.title}" - Original price: ${result.price}, Final price: ${result.price}`);
          return {
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
          };
        });

        console.log("Normalized products: ", normalizedProducts.length);
        console.log('🔍 Frontend normalized prices - First 3 products:', normalizedProducts.slice(0, 3).map(p => `"${p.title}" - Price: ${p.price}`));
        
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
            
          toast.success("Search completed", { description });
        }
      } else if (page === 1) {
        toast.info("No results found", {
          description: `No products found matching "${query}"`
        });
      }
      
    } catch (err) {
      // Only show error if this search is still current
      if (searchRequestRef.current === searchId && !abortControllerRef.current?.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : "Search failed";
        setError(errorMessage);
        
        toast.error("Search error", {
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
      console.log('Loading default marketplace products...');
      
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

        console.log("Loaded default products: ", normalizedProducts.length);
        
        // Update products context with default products
        setProducts(normalizedProducts);
        
        toast.success("Marketplace loaded", { 
          description: `Showing ${normalizedProducts.length} featured products` 
        });
      } else {
        console.log("No default products found");
        toast.info("Welcome to the marketplace", {
          description: "Use the search bar to find amazing gifts"
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products";
      setError(errorMessage);
      
      toast.error("Error loading marketplace", {
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
    toast.success("Search cache cleared");
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

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching: isSearching || isLoading,
    setSearchTerm,
    currentPage,
    filters,
    filteredProducts,
    availableCategories,
    activeFilterCount,
    updateFilters,
    clearFilters,
    error,
    isLoading,
    handleRetrySearch,
    clearCache,
    loadDefaultProducts
  };
};
