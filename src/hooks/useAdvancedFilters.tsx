
import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '@/types/product';

export type SortByOption = 'relevance' | 'price-low' | 'price-high' | 'rating' | 'newest';
export type AvailabilityOption = 'all' | 'in-stock' | 'pre-order';

export interface FilterState {
  priceRange: {
    min: number;
    max: number;
  };
  categories: string[];
  minRating: number;
  availability: AvailabilityOption;
  sortBy: SortByOption;
}

const DEFAULT_FILTERS: FilterState = {
  priceRange: { min: 0, max: 1000 },
  categories: [],
  minRating: 0,
  availability: 'all',
  sortBy: 'relevance'
};

export const useAdvancedFilters = (products: Product[]) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize from URL params
    const urlFilters = { ...DEFAULT_FILTERS };
    
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const categories = searchParams.get('categories');
    const minRating = searchParams.get('minRating');
    const availability = searchParams.get('availability');
    const sortBy = searchParams.get('sortBy');

    if (minPrice) urlFilters.priceRange.min = parseInt(minPrice);
    if (maxPrice) urlFilters.priceRange.max = parseInt(maxPrice);
    if (categories) urlFilters.categories = categories.split(',');
    if (minRating) urlFilters.minRating = parseFloat(minRating);
    if (availability && ['all', 'in-stock', 'pre-order'].includes(availability)) {
      urlFilters.availability = availability as AvailabilityOption;
    }
    if (sortBy && ['relevance', 'price-low', 'price-high', 'rating', 'newest'].includes(sortBy)) {
      urlFilters.sortBy = sortBy as SortByOption;
    }

    return urlFilters;
  });

  // Update URL when filters change
  const updateUrlParams = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams(searchParams);
    
    // Only add non-default values to URL
    if (newFilters.priceRange.min !== DEFAULT_FILTERS.priceRange.min) {
      params.set('minPrice', newFilters.priceRange.min.toString());
    } else {
      params.delete('minPrice');
    }
    
    if (newFilters.priceRange.max !== DEFAULT_FILTERS.priceRange.max) {
      params.set('maxPrice', newFilters.priceRange.max.toString());
    } else {
      params.delete('maxPrice');
    }
    
    if (newFilters.categories.length > 0) {
      params.set('categories', newFilters.categories.join(','));
    } else {
      params.delete('categories');
    }
    
    if (newFilters.minRating !== DEFAULT_FILTERS.minRating) {
      params.set('minRating', newFilters.minRating.toString());
    } else {
      params.delete('minRating');
    }
    
    if (newFilters.availability !== DEFAULT_FILTERS.availability) {
      params.set('availability', newFilters.availability);
    } else {
      params.delete('availability');
    }
    
    if (newFilters.sortBy !== DEFAULT_FILTERS.sortBy) {
      params.set('sortBy', newFilters.sortBy);
    } else {
      params.delete('sortBy');
    }

    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  }, [filters, updateUrlParams]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    updateUrlParams(DEFAULT_FILTERS);
  }, [updateUrlParams]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Price filter
      const price = product.price || 0;
      if (price < filters.priceRange.min || price > filters.priceRange.max) {
        return false;
      }

      // Category filter
      if (filters.categories.length > 0) {
        const productCategory = product.category || '';
        if (!filters.categories.some(cat => 
          productCategory.toLowerCase().includes(cat.toLowerCase())
        )) {
          return false;
        }
      }

      // Rating filter
      const rating = product.rating || 0;
      if (rating < filters.minRating) {
        return false;
      }

      // Availability filter (mock logic for demo)
      if (filters.availability === 'in-stock') {
        // Assume products with even IDs are in stock
        const id = parseInt(product.product_id || '0');
        if (id % 2 !== 0) return false;
      }

      return true;
    });

    // Sort products
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        // Sort by creation date if available, otherwise by ID
        filtered.sort((a, b) => {
          const aId = parseInt(a.product_id || '0');
          const bId = parseInt(b.product_id || '0');
          return bId - aId;
        });
        break;
      default:
        // Relevance - keep original order
        break;
    }

    return filtered;
  }, [products, filters]);

  // Get available categories from products
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    return Array.from(categories).sort();
  }, [products]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priceRange.min !== DEFAULT_FILTERS.priceRange.min || 
        filters.priceRange.max !== DEFAULT_FILTERS.priceRange.max) count++;
    if (filters.categories.length > 0) count++;
    if (filters.minRating !== DEFAULT_FILTERS.minRating) count++;
    if (filters.availability !== DEFAULT_FILTERS.availability) count++;
    if (filters.sortBy !== DEFAULT_FILTERS.sortBy) count++;
    return count;
  }, [filters]);

  return {
    filters,
    filteredProducts,
    availableCategories,
    activeFilterCount,
    updateFilters,
    clearFilters
  };
};
