
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useAdvancedFilters } from "@/hooks/useAdvancedFilters";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { toast } from "sonner";

export const useEnhancedMarketplaceSearch = () => {
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchIdRef = useRef<string>("");
  
  // Get search term from URL
  const searchParams = new URLSearchParams(location.search);
  const urlSearchTerm = searchParams.get("search") || "";
  
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

  // Perform search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm !== searchIdRef.current) {
      searchIdRef.current = debouncedSearchTerm;
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // Prefetch popular searches on mount
  useEffect(() => {
    enhancedZincApiService.prefetchPopularSearches();
  }, []);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Enhanced search for: "${query}"`);
      
      const searchResult = await enhancedZincApiService.searchProducts(query, 50);
      
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
          rating: result.rating,
          reviewCount: result.review_count
        }));
        
        // Update products context
        setProducts(prev => {
          const nonZincProducts = prev.filter(p => 
            p.vendor !== "Amazon via Zinc" && 
            p.vendor !== "Elyphant"
          );
          return [...nonZincProducts, ...normalizedProducts];
        });
        
        const description = searchResult.cached 
          ? `Found ${searchResult.results.length} cached results for "${query}"`
          : `Found ${searchResult.results.length} results for "${query}"`;
          
        toast.success("Search completed", { description });
      } else {
        toast.info("No results found", {
          description: `No products found matching "${query}"`
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      setError(errorMessage);
      
      toast.error("Search error", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => performSearch(query)
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrySearch = () => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  };

  const clearCache = () => {
    enhancedZincApiService.clearCache();
    toast.success("Search cache cleared");
  };

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching: isSearching || isLoading,
    setSearchTerm,
    filters,
    filteredProducts,
    availableCategories,
    activeFilterCount,
    updateFilters,
    clearFilters,
    error,
    isLoading,
    handleRetrySearch,
    clearCache
  };
};
