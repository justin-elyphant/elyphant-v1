
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useAdvancedFilters } from "@/hooks/useAdvancedFilters";
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

  const performSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real implementation, this would call the Zinc API
      console.log(`Searching for: "${query}"`);
      
      // For now, we'll just show a success message
      toast.success("Search completed", {
        description: `Found results for "${query}"`
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      setError(errorMessage);
      toast.error("Search failed", {
        description: errorMessage
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
    handleRetrySearch
  };
};
