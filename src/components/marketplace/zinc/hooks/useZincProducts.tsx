
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
    // Add this error state
    error: searchError,
    // Add other properties as needed
    localSearchTerm,
    setLocalSearchTerm,
    marketplaceProducts,
    specialCaseProducts
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
    localSearchTerm,
    setLocalSearchTerm,
    syncProducts,
    handleSearch,
    isLoading: isSearchLoading || isSyncLoading,
    error: searchError || syncError,
    marketplaceProducts,
    specialCaseProducts
  };
};
