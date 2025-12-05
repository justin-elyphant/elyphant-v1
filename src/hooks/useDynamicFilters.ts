/**
 * useDynamicFilters - Compatibility stub
 * @deprecated Use useSmartFilters instead
 */

import { useState, useCallback, useMemo } from "react";

// Exported types for backward compatibility
export interface DynamicFilter {
  key: string;
  label: string;
  type: 'checkbox' | 'range' | 'select';
  options?: DynamicFilterOption[];
  value?: any;
}

export interface DynamicFilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface DynamicFilterState {
  priceRange: [number, number];
  selectedCategories: string[];
  selectedBrands: string[];
  selectedDemographics: string[];
  selectedOccasions: string[];
  selectedAttributes: Record<string, string[]>;
  freeShipping: boolean;
  sortBy: string;
  [key: string]: any;
}

export interface DynamicFilterOptions {
  categories: string[];
  brands: string[];
  attributes: Record<string, string[]>;
  priceRanges?: { min: number; max: number; label: string }[];
}

export interface SearchContext {
  query: string;
  category?: string;
  filters?: DynamicFilterState;
  gender?: string;
  ageGroup?: string;
  occasion?: string;
  isGiftContext?: boolean;
  productCategory?: string;
}

// Alias for backward compatibility
export type DynamicFiltersState = DynamicFilterState;

const defaultFilterState: DynamicFilterState = {
  priceRange: [0, 1000],
  selectedCategories: [],
  selectedBrands: [],
  selectedDemographics: [],
  selectedOccasions: [],
  selectedAttributes: {},
  freeShipping: false,
  sortBy: "relevance"
};

export const useDynamicFilters = (products: any[] = [], searchQuery: string = "") => {
  const [filters, setFilters] = useState<DynamicFilterState>({ ...defaultFilterState });
  
  // Generate dynamic filters based on products
  const dynamicFilters = useMemo((): DynamicFilter[] => {
    if (!products.length) return [];
    
    const brands = new Map<string, number>();
    const categories = new Map<string, number>();
    const colors = new Map<string, number>();
    const sizes = new Map<string, number>();
    
    products.forEach(p => {
      if (p.brand) brands.set(p.brand, (brands.get(p.brand) || 0) + 1);
      if (p.category) categories.set(p.category, (categories.get(p.category) || 0) + 1);
      if (p.color) colors.set(p.color, (colors.get(p.color) || 0) + 1);
      if (p.size) sizes.set(p.size, (sizes.get(p.size) || 0) + 1);
    });
    
    const result: DynamicFilter[] = [];
    
    if (brands.size > 0) {
      result.push({
        key: 'brand',
        label: 'Brand',
        type: 'checkbox',
        options: Array.from(brands).map(([value, count]) => ({ value, label: value, count }))
      });
    }
    
    if (categories.size > 0) {
      result.push({
        key: 'category',
        label: 'Category', 
        type: 'checkbox',
        options: Array.from(categories).map(([value, count]) => ({ value, label: value, count }))
      });
    }
    
    if (colors.size > 0) {
      result.push({
        key: 'color',
        label: 'Color',
        type: 'checkbox',
        options: Array.from(colors).map(([value, count]) => ({ value, label: value, count }))
      });
    }
    
    if (sizes.size > 0) {
      result.push({
        key: 'size',
        label: 'Size',
        type: 'checkbox',
        options: Array.from(sizes).map(([value, count]) => ({ value, label: value, count }))
      });
    }
    
    return result;
  }, [products]);

  // Extract filter options from products
  const filterOptions: DynamicFilterOptions = useMemo(() => {
    const categories = new Set<string>();
    const brands = new Set<string>();
    const attributes: Record<string, Set<string>> = {};

    products.forEach(product => {
      if (product.category) categories.add(product.category);
      if (product.brand) brands.add(product.brand);
    });

    return {
      categories: Array.from(categories),
      brands: Array.from(brands),
      attributes: Object.fromEntries(
        Object.entries(attributes).map(([k, v]) => [k, Array.from(v)])
      ),
      priceRanges: [
        { min: 0, max: 25, label: "Under $25" },
        { min: 25, max: 50, label: "$25 - $50" },
        { min: 50, max: 100, label: "$50 - $100" },
        { min: 100, max: 1000, label: "$100+" }
      ]
    };
  }, [products]);

  // Detect search context from query
  const searchContext: SearchContext = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return {
      query: searchQuery,
      gender: query.includes("men") ? "men" : query.includes("women") ? "women" : undefined,
      ageGroup: query.includes("kids") ? "kids" : query.includes("teen") ? "teen" : undefined,
      occasion: query.includes("birthday") ? "birthday" : query.includes("christmas") ? "christmas" : undefined,
      isGiftContext: query.includes("gift"),
      productCategory: filterOptions.categories[0]
    };
  }, [searchQuery, filterOptions.categories]);
  
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((updates: Partial<DynamicFilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({ ...defaultFilterState });
  }, []);
  
  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);
  
  // Generate filter options for specific key
  const getFilterOptions = useCallback((key: string) => {
    const filter = dynamicFilters.find(f => f.key === key);
    if (!filter) return null;
    return { key, options: filter.options || [] };
  }, [dynamicFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
    count += filters.selectedCategories.length;
    count += filters.selectedBrands.length;
    count += filters.selectedDemographics.length;
    count += filters.selectedOccasions.length;
    if (filters.freeShipping) count++;
    return count;
  }, [filters]);
  
  return {
    filters,
    filterOptions,
    searchContext,
    dynamicFilters,
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,
    setFilters,
    hasActiveFilters: activeFilterCount > 0,
    activeFilterCount,
    getFilterOptions,
  };
};

export default useDynamicFilters;
