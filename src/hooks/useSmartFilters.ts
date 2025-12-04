/**
 * Unified Smart Filters Hook
 * Provides dynamic, category-aware filters for both mobile and desktop
 */

import { useMemo } from "react";
import { 
  generateSmartFilters, 
  detectCategoryFromSearch,
  type SmartFilterContext,
  type FilterConfig 
} from "@/components/marketplace/utils/smartFilterDetection";

export interface UseSmartFiltersReturn {
  filters: Record<string, FilterConfig>;
  detectedCategory: string | null;
  context: SmartFilterContext;
  hasFilters: boolean;
  quickFilters: QuickFilter[];
}

export interface QuickFilter {
  key: string;
  label: string;
  type: 'dropdown' | 'toggle';
  options?: { value: string; label: string }[];
}

/**
 * Hook that provides dynamic filters based on search term and products
 */
export function useSmartFilters(
  searchTerm: string,
  products: any[] = []
): UseSmartFiltersReturn {
  const context = useMemo(() => {
    return generateSmartFilters(searchTerm, products);
  }, [searchTerm, products]);

  // Generate quick filters for mobile horizontal scroll
  const quickFilters = useMemo((): QuickFilter[] => {
    const filters: QuickFilter[] = [];
    const { suggestedFilters, detectedCategory } = context;

    // Sort is always first
    filters.push({
      key: 'sortBy',
      label: 'Sort',
      type: 'dropdown',
      options: [
        { value: 'relevance', label: 'Featured' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' },
        { value: 'rating', label: 'Top Rated' },
        { value: 'newest', label: 'Newest' },
      ]
    });

    // Price is always second
    filters.push({
      key: 'priceRange',
      label: 'Price',
      type: 'dropdown',
      options: [
        { value: '0-25', label: 'Under $25' },
        { value: '25-50', label: '$25 - $50' },
        { value: '50-100', label: '$50 - $100' },
        { value: '100-200', label: '$100 - $200' },
        { value: '200+', label: '$200+' },
      ]
    });

    // Category-specific filters
    if (detectedCategory === 'clothing') {
      // Size filters for clothing
      if (suggestedFilters.size) {
        filters.push({
          key: 'size',
          label: 'Size',
          type: 'dropdown',
          options: suggestedFilters.size.options
        });
      }
      if (suggestedFilters.waist) {
        filters.push({
          key: 'waist',
          label: 'Waist',
          type: 'dropdown',
          options: suggestedFilters.waist.options
        });
      }
      if (suggestedFilters.color) {
        filters.push({
          key: 'color',
          label: 'Color',
          type: 'dropdown',
          options: suggestedFilters.color.options
        });
      }
      if (suggestedFilters.fit) {
        filters.push({
          key: 'fit',
          label: 'Fit',
          type: 'dropdown',
          options: suggestedFilters.fit.options
        });
      }
    } else if (detectedCategory === 'electronics') {
      // Brand filter for electronics
      if (suggestedFilters.brand) {
        filters.push({
          key: 'brand',
          label: 'Brand',
          type: 'dropdown',
          options: suggestedFilters.brand.options
        });
      }
    }

    // Always add brand if available and not already added
    if (suggestedFilters.brand && !filters.find(f => f.key === 'brand')) {
      filters.push({
        key: 'brand',
        label: 'Brand',
        type: 'dropdown',
        options: suggestedFilters.brand.options
      });
    }

    return filters;
  }, [context]);

  return {
    filters: context.suggestedFilters,
    detectedCategory: context.detectedCategory,
    context,
    hasFilters: Object.keys(context.suggestedFilters).length > 0,
    quickFilters,
  };
}

export default useSmartFilters;
