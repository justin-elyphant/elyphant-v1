/**
 * Smart Search Hook - Phase 4: User Experience Enhancement
 * Provides enhanced search with size indicators and progressive loading
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { smartCachingService } from "@/services/smartCachingService";
import { enhanceQueryForSizes, createSizeAwareSearchStrategy } from "@/services/smartQueryEnhancer";
import { extractAdvancedSizes } from "@/utils/advancedSizeDetection";
import { detectCategoryFromSearch } from "@/components/marketplace/utils/smartFilterDetection";
import { toast } from "sonner";

export interface SmartSearchResult {
  products: any[];
  hasMoreSizes: boolean;
  sizeOptimized: boolean;
  suggestedSizeSearches: string[];
  totalSizeVariations: number;
  categoryDetected: string | null;
  fromCache: boolean;
}

export interface SmartSearchOptions {
  maxResults?: number;
  enableSizeOptimization?: boolean;
  enableProgressiveLoading?: boolean;
  showSizeIndicators?: boolean;
}

export const useSmartSearch = (options: SmartSearchOptions = {}) => {
  const {
    maxResults = 50,
    enableSizeOptimization = true,
    enableProgressiveLoading = true,
    showSizeIndicators = true
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SmartSearchResult | null>(null);
  const [progressiveResults, setProgressiveResults] = useState<any[]>([]);
  const [loadingMoreSizes, setLoadingMoreSizes] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const currentSearchRef = useRef<string>('');

  /**
   * Main smart search function
   */
  const search = useCallback(async (
    query: string, 
    filters?: any
  ): Promise<SmartSearchResult> => {
    if (!query.trim()) {
      return {
        products: [],
        hasMoreSizes: false,
        sizeOptimized: false,
        suggestedSizeSearches: [],
        totalSizeVariations: 0,
        categoryDetected: null,
        fromCache: false
      };
    }

    setIsLoading(true);
    setError(null);
    currentSearchRef.current = query;

    try {
      console.log(`🎯 Smart Search: "${query}" with options:`, { enableSizeOptimization, maxResults });

      // Phase 1: Enhanced query analysis
      const queryEnhancement = enhanceQueryForSizes(query);
      const categoryDetected = detectCategoryFromSearch(query);
      
      console.log(`🎯 Query enhancement:`, queryEnhancement);
      console.log(`🎯 Category detected:`, categoryDetected);

      // Phase 3: Smart caching search
      const searchResponse = await smartCachingService.smartSearch(
        query,
        maxResults,
        filters
      );

      const { results, fromCache, sizeOptimized } = searchResponse;

      // Phase 2: Advanced size analysis
      const sizeAnalysis = extractAdvancedSizes(results);
      const totalSizeVariations = 
        sizeAnalysis.waist.length + 
        sizeAnalysis.inseam.length + 
        sizeAnalysis.shoes.length + 
        sizeAnalysis.clothing.length;

      // Generate suggested size searches
      const suggestedSizeSearches = generateSizeSuggestions(query, categoryDetected, sizeAnalysis);

      // Determine if more sizes might be available
      const hasMoreSizes = 
        enableSizeOptimization && 
        categoryDetected === 'clothing' && 
        totalSizeVariations < 10 && // Arbitrary threshold
        results.length === maxResults; // Suggests we hit the limit

      // Show size indicators if enabled
      if (showSizeIndicators && totalSizeVariations > 0) {
        const message = sizeOptimized 
          ? `Found ${totalSizeVariations} size variations in results`
          : `Found ${totalSizeVariations} sizes - try size-specific searches for more options`;
        
        toast.success("Size Detection", {
          description: message,
          duration: 3000
        });
      }

      const result: SmartSearchResult = {
        products: results,
        hasMoreSizes,
        sizeOptimized,
        suggestedSizeSearches,
        totalSizeVariations,
        categoryDetected,
        fromCache
      };

      setSearchResult(result);
      setProgressiveResults(results);

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      console.error('Smart search error:', err);
      setError(errorMessage);
      
      toast.error("Search Error", {
        description: errorMessage,
        duration: 5000
      });

      const emptyResult: SmartSearchResult = {
        products: [],
        hasMoreSizes: false,
        sizeOptimized: false,
        suggestedSizeSearches: [],
        totalSizeVariations: 0,
        categoryDetected: null,
        fromCache: false
      };

      setSearchResult(emptyResult);
      return emptyResult;

    } finally {
      setIsLoading(false);
    }
  }, [maxResults, enableSizeOptimization, showSizeIndicators]);

  /**
   * Progressive loading for additional sizes
   */
  const loadMoreSizes = useCallback(async (specificSize?: string): Promise<void> => {
    if (!searchResult || !currentSearchRef.current) return;

    setLoadingMoreSizes(true);

    try {
      const baseQuery = currentSearchRef.current;
      const sizeQuery = specificSize 
        ? `${baseQuery} size ${specificSize}`
        : `${baseQuery} various sizes additional`;

      console.log(`🎯 Loading more sizes: "${sizeQuery}"`);

      const additionalResponse = await smartCachingService.smartSearch(
        sizeQuery,
        25 // Smaller batch for additional results
      );

      if (additionalResponse.results.length > 0) {
        // Merge with existing results, avoiding duplicates
        const existingIds = new Set(progressiveResults.map(p => p.product_id));
        const newResults = additionalResponse.results.filter(
          product => !existingIds.has(product.product_id)
        );

        if (newResults.length > 0) {
          setProgressiveResults(prev => [...prev, ...newResults]);
          
          // Update search result
          setSearchResult(prev => prev ? {
            ...prev,
            products: [...progressiveResults, ...newResults],
            hasMoreSizes: newResults.length === 25 // Still more if we got a full batch
          } : null);

          toast.success("More Sizes Loaded", {
            description: `Found ${newResults.length} additional products`,
            duration: 3000
          });
        } else {
          toast.info("No New Sizes", {
            description: "No additional unique products found",
            duration: 3000
          });
        }
      }
    } catch (err) {
      console.error('Load more sizes error:', err);
      toast.error("Failed to load more sizes", {
        description: "Please try a different size or search term",
        duration: 5000
      });
    } finally {
      setLoadingMoreSizes(false);
    }
  }, [searchResult, progressiveResults]);

  /**
   * Debounced search for real-time search
   */
  const debouncedSearch = useCallback((query: string, filters?: any) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      search(query, filters);
    }, 300);
  }, [search]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setSearchResult(null);
    setProgressiveResults([]);
    setError(null);
    currentSearchRef.current = '';
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    search,
    debouncedSearch,
    loadMoreSizes,
    clearSearch,
    isLoading,
    loadingMoreSizes,
    error,
    searchResult,
    progressiveResults
  };
};

/**
 * Generate size-specific search suggestions
 */
function generateSizeSuggestions(
  query: string, 
  category: string | null, 
  sizeAnalysis: any
): string[] {
  const suggestions: string[] = [];

  if (category === 'clothing') {
    // Waist size suggestions
    if (sizeAnalysis.waist.length > 0) {
      const commonWaists = ['32', '34', '36'];
      commonWaists.forEach(size => {
        if (!sizeAnalysis.waist.includes(size)) {
          suggestions.push(`${query} ${size}W waist`);
        }
      });
    }

    // Clothing size suggestions
    if (sizeAnalysis.clothing.length > 0) {
      const commonSizes = ['M', 'L', 'XL'];
      commonSizes.forEach(size => {
        if (!sizeAnalysis.clothing.includes(size)) {
          suggestions.push(`${query} size ${size}`);
        }
      });
    }

    // Shoe size suggestions
    if (query.toLowerCase().includes('shoe') && sizeAnalysis.shoes.length > 0) {
      const commonShoeSizes = ['9', '10', '11'];
      commonShoeSizes.forEach(size => {
        if (!sizeAnalysis.shoes.includes(size)) {
          suggestions.push(`${query} size ${size}`);
        }
      });
    }
  }

  return suggestions.slice(0, 3); // Limit to 3 suggestions
}