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
  [key: string]: any;
}

export interface DynamicFilterOptions {
  key: string;
  options: DynamicFilterOption[];
}

export interface SearchContext {
  query: string;
  category?: string;
  filters: DynamicFilterState;
}

// Alias for backward compatibility
export type DynamicFiltersState = DynamicFilterState;

export const useDynamicFilters = (products: any[] = []) => {
  const [filters, setFilters] = useState<DynamicFilterState>({});
  
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
  
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);
  
  // Generate filter options for specific key
  const getFilterOptions = useCallback((key: string): DynamicFilterOptions | null => {
    const filter = dynamicFilters.find(f => f.key === key);
    if (!filter) return null;
    return { key, options: filter.options || [] };
  }, [dynamicFilters]);
  
  return {
    filters,
    dynamicFilters,
    updateFilter,
    clearFilters,
    clearFilter,
    setFilters,
    hasActiveFilters: Object.keys(filters).length > 0,
    getFilterOptions,
  };
};

export default useDynamicFilters;
