import React from "react";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { Product } from "@/types/product";

/**
 * SearchCapabilityRouter - Migration helper component
 * 
 * This component provides a gradual migration path from legacy search components
 * to the new unified search system while preserving all existing functionality.
 * 
 * Usage:
 * 1. Wrap your existing search component with this router
 * 2. Use the provided search capabilities instead of legacy hooks
 * 3. Remove this wrapper once fully migrated to useUnifiedSearch directly
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
  const {
    query,
    results,
    isLoading,
    error,
    searchHistory,
    search,
    searchProducts,
    setQuery,
    clearSearch,
    cacheStats
  } = useUnifiedSearch({
    defaultQuery,
    maxResults,
    autoSearch
  });

  // Legacy compatibility wrapper for searchZincProducts
  const searchZincProducts = async (searchTerm: string, searchChanged: boolean): Promise<Product[]> => {
    console.warn('searchZincProducts called via SearchCapabilityRouter. Please migrate to searchProducts() method.');
    return await searchProducts(searchTerm);
  };

  // Enhanced search method that returns unified results
  const enhancedSearch = async (query: string, options: any = {}) => {
    await search(query, options);
  };

  const capabilities: SearchCapabilities = {
    // State
    query,
    isLoading,
    error,
    
    // Results  
    friends: results.friends,
    products: results.products,
    brands: results.brands,
    totalResults: results.total,
    
    // Actions
    search: enhancedSearch,
    searchProducts,
    setQuery,
    clearSearch,
    
    // Legacy compatibility
    searchZincProducts,
    
    // Utilities
    searchHistory,
    cacheStats
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