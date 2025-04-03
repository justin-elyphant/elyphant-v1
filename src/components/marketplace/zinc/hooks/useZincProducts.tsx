
import { useZincProductSearch } from "./useZincProductSearch";
import { useZincSync } from "./useZincSync";

/**
 * Combined hook for Zinc product management
 */
export const useZincProducts = () => {
  // Use our search hook
  const { 
    searchTerm, 
    setSearchTerm, 
    handleSearch, 
    isLoading: isSearchLoading, 
    error: searchError 
  } = useZincProductSearch();
  
  // Use our sync hook
  const { 
    syncProducts, 
    isLoading: isSyncLoading, 
    error: syncError 
  } = useZincSync();

  return {
    searchTerm,
    setSearchTerm,
    syncProducts,
    handleSearch,
    isLoading: isSearchLoading || isSyncLoading,
    error: searchError || syncError
  };
};
