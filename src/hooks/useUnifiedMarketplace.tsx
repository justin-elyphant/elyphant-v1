/**
 * useUnifiedMarketplace - Compatibility wrapper
 * 
 * This hook re-exports from useMarketplace.ts for backward compatibility.
 * All new code should import from useMarketplace directly.
 * 
 * @deprecated Use useMarketplace instead
 */

import { useMarketplace, type UseMarketplaceOptions } from "./useMarketplace";
import { useSearchParams } from "react-router-dom";

interface UseUnifiedMarketplaceOptions {
  autoLoadOnMount?: boolean;
  defaultSearchTerm?: string;
}

export const useUnifiedMarketplace = (options: UseUnifiedMarketplaceOptions = {}) => {
  const [searchParams] = useSearchParams();
  const marketplace = useMarketplace({
    autoFetch: options.autoLoadOnMount ?? true,
    initialQuery: options.defaultSearchTerm,
  });

  // Map urlState to legacy return format for backward compatibility
  const urlSearchTerm = marketplace.urlState.query;
  const category = marketplace.urlState.category;
  const luxuryCategories = category === 'luxury' || searchParams.get('luxuryCategories') === 'true';
  const giftsForHer = category === 'gifts-for-her' || searchParams.get('giftsForHer') === 'true';
  const giftsForHim = category === 'gifts-for-him' || searchParams.get('giftsForHim') === 'true';
  const giftsUnder50 = category === 'gifts-under-50' || searchParams.get('giftsUnder50') === 'true';
  const brandCategories = category?.startsWith('brand-') ? category.replace('brand-', '') : searchParams.get('brandCategories');
  const personId = searchParams.get('personId');
  const occasionType = searchParams.get('occasionType');

  return {
    // State
    products: marketplace.products,
    isLoading: marketplace.isLoading,
    error: marketplace.error,
    searchTerm: urlSearchTerm,
    hasMore: false, // Pagination handled differently now
    totalCount: marketplace.totalCount,
    
    // URL state (legacy format)
    urlSearchTerm,
    luxuryCategories,
    giftsForHer,
    giftsForHim,
    giftsUnder50,
    brandCategories,
    personId,
    occasionType,
    
    // Actions
    search: marketplace.search,
    clearSearch: marketplace.clearSearch,
    refresh: () => marketplace.search(urlSearchTerm),
    getProductDetails: async (productId: string) => null, // Now handled by ProductCatalogService
    
    // Utilities
    cacheStats: marketplace.cacheStats
  };
};
