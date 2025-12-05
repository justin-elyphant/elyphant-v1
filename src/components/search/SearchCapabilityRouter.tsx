import React from "react";
import { useMarketplace } from "@/hooks/useMarketplace";
import { Product } from "@/types/product";

/**
 * SearchCapabilityRouter - Migration helper component
 * @deprecated Use useMarketplace hook directly instead
 */

interface SearchCapabilityRouterProps {
  children: (capabilities: SearchCapabilities) => React.ReactNode;
  defaultQuery?: string;
  maxResults?: number;
  autoSearch?: boolean;
}

export interface SearchCapabilities {
  query: string;
  isLoading: boolean;
  error: string | null;
  friends: any[];
  products: Product[];
  brands: string[];
  totalResults: number;
  search: (query: string, options?: any) => Promise<void>;
  searchProducts: (query: string, options?: any) => Promise<Product[]>;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  searchZincProducts: (searchTerm: string, searchChanged: boolean) => Promise<Product[]>;
  searchHistory: string[];
  cacheStats: any;
}

export const SearchCapabilityRouter: React.FC<SearchCapabilityRouterProps> = ({
  children,
}) => {
  const marketplace = useMarketplace();

  const searchProducts = async (query: string): Promise<Product[]> => {
    const response = await marketplace.executeSearch(query);
    return response.products || [];
  };

  const capabilities: SearchCapabilities = {
    query: marketplace.searchTerm,
    isLoading: marketplace.isLoading,
    error: marketplace.error || null,
    friends: [],
    products: marketplace.products,
    brands: [],
    totalResults: marketplace.totalCount,
    search: async (query: string) => { marketplace.search(query); },
    searchProducts,
    setQuery: (query: string) => { marketplace.search(query); },
    clearSearch: marketplace.clearSearch,
    searchZincProducts: async (searchTerm: string) => searchProducts(searchTerm),
    searchHistory: [],
    cacheStats: marketplace.cacheStats || {}
  };

  return <>{children(capabilities)}</>;
};

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
