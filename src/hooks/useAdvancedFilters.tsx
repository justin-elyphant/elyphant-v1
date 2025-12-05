/**
 * useAdvancedFilters - Compatibility stub
 * @deprecated Use useSmartFilters instead
 */

import { useState, useCallback, useMemo } from "react";

// Exported types for backward compatibility
export type SortByOption = 'relevance' | 'price-low' | 'price-high' | 'rating' | 'newest';
export type AvailabilityOption = 'all' | 'in-stock' | 'pre-order';

export interface FilterState {
  priceRange: { min: number; max: number };
  categories: string[];
  brands: string[];
  rating: number | null;
  sortBy: SortByOption;
  availability: AvailabilityOption;
  [key: string]: any;
}

export interface FilterConfig {
  type: string;
  label: string;
  options: string[];
}

export interface AdvancedFilters {
  priceRange?: { min: number; max: number };
  brands?: string[];
  categories?: string[];
  rating?: number;
  sortBy?: SortByOption;
  availability?: AvailabilityOption;
  [key: string]: any;
}

const defaultFilterState: FilterState = {
  priceRange: { min: 0, max: 1000 },
  categories: [],
  brands: [],
  rating: null,
  sortBy: 'relevance',
  availability: 'all',
};

export const useAdvancedFilters = (products: any[] = [], initialFilters: Partial<FilterState> = {}) => {
  const [filters, setFilters] = useState<FilterState>({ ...defaultFilterState, ...initialFilters });
  
  // Derive available categories from products
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories);
  }, [products]);
  
  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    
    return products.filter(product => {
      // Price filter
      const price = product.price || 0;
      if (price < filters.priceRange.min || price > filters.priceRange.max) return false;
      
      // Category filter
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(product.category)) return false;
      }
      
      // Brand filter
      if (filters.brands.length > 0) {
        if (!filters.brands.includes(product.brand)) return false;
      }
      
      // Rating filter
      if (filters.rating !== null) {
        const rating = product.stars || product.rating || 0;
        if (rating < filters.rating) return false;
      }
      
      return true;
    });
  }, [products, filters]);
  
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters(defaultFilterState);
  }, []);
  
  const applyFilters = useCallback(() => {
    // Stub - no-op, filtering is automatic via useMemo
  }, []);
  
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.rating !== null) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) count++;
    return count;
  }, [filters]);
  
  return {
    filters,
    setFilters,
    updateFilter,
    updateFilters,
    clearFilters,
    applyFilters,
    filterConfig: [] as FilterConfig[],
    hasActiveFilters: activeFilterCount > 0,
    activeFilterCount,
    filteredProducts,
    availableCategories,
  };
};

export default useAdvancedFilters;
