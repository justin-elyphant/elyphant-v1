/**
 * Enhanced category search hook with brand diversity
 */

import { useState, useCallback } from 'react';
import { searchCategoryWithDiversity, CategorySearchOptions, CategorySearchResult } from '@/components/marketplace/zinc/utils/search/enhancedCategorySearch';
import { ZincProduct } from '@/components/marketplace/zinc/types';
import { toast } from 'sonner';

export const useEnhancedCategorySearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchResult, setLastSearchResult] = useState<CategorySearchResult | null>(null);

  const searchCategoryProducts = useCallback(async (
    category: string,
    searchTerm: string,
    options?: Partial<CategorySearchOptions>
  ): Promise<ZincProduct[]> => {
    setIsLoading(true);
    
    const searchOptions: CategorySearchOptions = {
      enableBrandDiversity: true,
      maxProductsPerBrand: 3,
      useMultipleSearchPasses: true,
      enableTrendingSearch: true,
      targetResultCount: 50,
      ...options
    };

    try {
      console.log(`Enhanced category search: ${category} with term "${searchTerm}"`);
      
      const result = await searchCategoryWithDiversity(category, searchTerm, searchOptions);
      setLastSearchResult(result);
      
      // Show success toast with diversity info
      if (result.products.length > 0) {
        const brandCount = Object.keys(result.brandDistribution).length;
        // Search completed silently - no toast needed
        console.log(`Found ${result.products.length} products from ${brandCount} brands`);
      } else {
        toast.error("No Results", {
          description: `No products found for ${category}`,
          duration: 3000
        });
      }
      
      return result.products;
      
    } catch (error) {
      console.error('Enhanced category search error:', error);
      toast.error("Search Error", {
        description: "Error searching for category products. Please try again.",
        duration: 4000
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    searchCategoryProducts,
    isLoading,
    lastSearchResult
  };
};