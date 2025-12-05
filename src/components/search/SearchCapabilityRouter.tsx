import React from "react";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { Product } from "@/types/product";

/**
 * SearchCapabilityRouter - Migration helper component
 * 
 * This component provides a gradual migration path from legacy search components
 * to the new unified search system while preserving all existing functionality.
 */

interface SearchCapabilityRouterProps {
  children: (capabilities: SearchCapabilities) => React.ReactNode;
  defaultQuery?: string;
  maxResults?: number;
  autoSearch?: boolean;
}

export interface SearchCapabilities {
  // State
  query: string;
  isLoading: boolean;
  error: string | null;
  
  // Results
  friends: any[];
  products: Product[];
  brands: string[];
  totalResults: number;
  
  // Actions
  search: (query: string, options?: any) => Promise<void>;
  searchProducts: (query: string, options?: any) => Promise<Product[]>;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  
  // Legacy compatibility methods
  searchZincProducts: (searchTerm: string, searchChanged: boolean) => Promise<Product[]>;
  
  // Utilities
  searchHistory: string[];
  cacheStats: any;
}

export const SearchCapabilityRouter: React.FC<SearchCapabilityRouterProps> = ({
  children,
  defaultQuery = "",
  maxResults = 20,
  autoSearch = false
}) => {
  const unifiedSearch = useUnifiedSearch({
    defaultQuery,
    maxResults,
    autoSearch
  });

  // Legacy compatibility wrapper for searchZincProducts
  const searchZincProducts = async (searchTerm: string, _searchChanged: boolean): Promise<Product[]> => {
    console.warn('searchZincProducts called via SearchCapabilityRouter. Please migrate to searchProducts() method.');
    return await unifiedSearch.searchProducts(searchTerm);
  };

  // Enhanced search method that returns unified results
  const enhancedSearch = async (query: string, _options: any = {}): Promise<void> => {
    await unifiedSearch.search(query);
  };

  const capabilities: SearchCapabilities = {
    // State
    query: unifiedSearch.query,
    isLoading: unifiedSearch.isLoading,
    error: unifiedSearch.error,
    
    // Results  
    friends: unifiedSearch.results.friends || [],
    products: unifiedSearch.results.products || [],
    brands: unifiedSearch.results.brands || [],
    totalResults: unifiedSearch.results.total || 0,
    
    // Actions
    search: enhancedSearch,
    searchProducts: unifiedSearch.searchProducts,
    setQuery: unifiedSearch.setQuery,
    clearSearch: unifiedSearch.clearSearch,
    
    // Legacy compatibility
    searchZincProducts,
    
    // Utilities
    searchHistory: unifiedSearch.searchHistory || [],
    cacheStats: unifiedSearch.cacheStats || {}
  };

  return <>{children(capabilities)}</>;
};

/**
 * Higher-order component for easier migration
 */
export const withSearchCapabilities = <P extends object>(
  Component: React.ComponentType<P & SearchCapabilities>,
  searchOptions: Omit<SearchCapabilityRouterProps, 'children'> = {}
) => {
  return (props: P) => (
    <SearchCapabilityRouter {...searchOptions}>
      {(capabilities) => <Component {...props} {...capabilities} />}
    </SearchCapabilityRouter>
  );
};

export default SearchCapabilityRouter;
