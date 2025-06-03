
import { useMemo } from "react";

export const useFilteredProducts = (products: any[], activeFilters: any, sortOption: string) => {
  return useMemo(() => {
    if (!products || products.length === 0) {
      return [];
    }

    let filtered = [...products];

    // Apply category filter
    if (activeFilters.categories.length > 0) {
      filtered = filtered.filter(product => 
        activeFilters.categories.includes(product.category)
      );
    }

    // Apply price range filter
    if (activeFilters.priceRange) {
      const [min, max] = activeFilters.priceRange;
      filtered = filtered.filter(product => 
        product.price >= min && product.price <= max
      );
    }

    // Apply rating filter
    if (activeFilters.rating > 0) {
      filtered = filtered.filter(product => 
        (product.rating || 0) >= activeFilters.rating
      );
    }

    // Apply stock filter
    if (activeFilters.inStock) {
      filtered = filtered.filter(product => product.inStock !== false);
    }

    // Apply sale filter
    if (activeFilters.onSale) {
      filtered = filtered.filter(product => product.onSale === true);
    }

    // Apply free shipping filter
    if (activeFilters.freeShipping) {
      filtered = filtered.filter(product => product.freeShipping === true);
    }

    // Apply brand filter
    if (activeFilters.brands.length > 0) {
      filtered = filtered.filter(product => 
        activeFilters.brands.includes(product.brand)
      );
    }

    // Apply sorting
    if (sortOption === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOption === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return filtered;
  }, [products, activeFilters, sortOption]);
};
