/**
 * useUnifiedSearch - Compatibility wrapper
 * @deprecated Use useMarketplace instead
 */

import { useMarketplace } from "./useMarketplace";
import { useCallback } from "react";

export const useUnifiedSearch = () => {
  const marketplace = useMarketplace();
  
  const searchProducts = useCallback((query: string) => {
    marketplace.search(query);
  }, [marketplace]);
  
  return {
    // Primary interface
    searchResults: marketplace.products,
    results: marketplace.products,
    searchProducts,
    products: marketplace.products,
    
    // Loading states
    isSearching: marketplace.isLoading,
    isLoading: marketplace.isLoading,
    
    // Error handling
    searchError: marketplace.error,
    error: marketplace.error,
    
    // Search state
    searchTerm: marketplace.urlState.query,
    query: marketplace.urlState.query,
    
    // Actions
    executeSearch: marketplace.search,
    search: marketplace.search,
    clearResults: marketplace.clearSearch,
    clearSearch: marketplace.clearSearch,
  };
};

export default useUnifiedSearch;
