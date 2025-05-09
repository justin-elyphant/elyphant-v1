
import { useState, useEffect, useMemo } from "react";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";

type FilterOptions = {
  priceRange: string | null;
  category: string | null;
  rating: number | null;
  freeShipping: boolean;
  sortBy: string;
};

export const useEnhancedFilters = (products: Product[]) => {
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: null,
    category: null,
    rating: null,
    freeShipping: false,
    sortBy: "relevance"
  });
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const isMobile = useIsMobile();
  
  // Extract unique categories from products
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    return Array.from(categorySet);
  }, [products]);
  
  // Apply filters when products or filter options change
  useEffect(() => {
    const applyFilters = () => {
      let result = [...products];
      
      // Apply category filter
      if (filters.category) {
        result = result.filter(product => product.category === filters.category);
      }
      
      // Apply price range filter
      if (filters.priceRange) {
        switch (filters.priceRange) {
          case "under25":
            result = result.filter(product => product.price < 25);
            break;
          case "25to50":
            result = result.filter(product => product.price >= 25 && product.price <= 50);
            break;
          case "50to100":
            result = result.filter(product => product.price > 50 && product.price <= 100);
            break;
          case "over100":
            result = result.filter(product => product.price > 100);
            break;
        }
      }
      
      // Apply rating filter
      if (filters.rating) {
        result = result.filter(product => product.rating && product.rating >= filters.rating);
      }
      
      // Apply free shipping filter if product has that property
      if (filters.freeShipping) {
        result = result.filter(product => (product as any).free_shipping === true);
      }
      
      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case "price-asc":
            result.sort((a, b) => a.price - b.price);
            break;
          case "price-desc":
            result.sort((a, b) => b.price - a.price);
            break;
          case "rating":
            result.sort((a, b) => ((b.rating || 0) - (a.rating || 0)));
            break;
          case "newest":
            // This would require a date field, falling back to ID for now
            result.sort((a, b) => {
              const idA = Number(a.id) || 0;
              const idB = Number(b.id) || 0;
              return idB - idA;
            });
            break;
        }
      }
      
      setFilteredProducts(result);
    };
    
    applyFilters();
  }, [products, filters]);
  
  const updateFilter = (filterType: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      priceRange: null,
      category: null,
      rating: null,
      freeShipping: false,
      sortBy: "relevance"
    });
  };
  
  return {
    filters,
    filteredProducts,
    categories,
    updateFilter,
    resetFilters,
    isMobile
  };
};
