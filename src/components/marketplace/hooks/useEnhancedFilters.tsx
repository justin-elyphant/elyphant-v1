
import { useState, useEffect, useMemo } from "react";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { extractVariationOptions, productMatchesVariationFilters, VariationOptions } from "@/utils/variationExtraction";

export type FilterOptions = {
  priceRange: [number, number];
  categories: string[];
  rating: number | null;
  freeShipping: boolean;
  favoritesOnly: boolean;
  sortBy: string;
  availableVariations?: VariationOptions;
  selectedVariations?: { [dimension: string]: string[] };
};

export const useEnhancedFilters = (products: Product[]) => {
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 1000],
    categories: [],
    rating: null,
    freeShipping: false,
    favoritesOnly: false,
    sortBy: "relevance",
    selectedVariations: {}
  });
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const isMobile = useIsMobile();
  
  // Extract available variations from products
  const availableVariations = useMemo(() => {
    return extractVariationOptions(products);
  }, [products]);
  
  // Update filters with available variations
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      availableVariations
    }));
  }, [availableVariations]);
  
  // Extract unique categories from products
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
      if (product.category_name && product.category_name !== product.category) {
        categorySet.add(product.category_name);
      }
    });
    return Array.from(categorySet).sort();
  }, [products]);
  
  // Apply filters when products or filter options change
  useEffect(() => {
    const applyFilters = () => {
      let result = [...products];
      
      // Apply category filters (multi-select)
      if (filters.categories && filters.categories.length > 0) {
        result = result.filter(product => {
          const productCategories = [
            product.category,
            product.category_name
          ].filter(Boolean) as string[];
          
          // Include product if it matches any selected category
          return filters.categories.some(category => 
            productCategories.includes(category)
          );
        });
      }
      
      // Apply price range filter
      if (filters.priceRange) {
        result = result.filter(product => 
          product.price >= filters.priceRange[0] && 
          product.price <= filters.priceRange[1]
        );
      }
      
      // Apply rating filter
      if (filters.rating) {
        result = result.filter(product => {
          const productRating = product.rating || product.stars;
          return productRating && productRating >= filters.rating;
        });
      }
      
      // Apply free shipping filter if product has that property
      if (filters.freeShipping) {
        result = result.filter(product => (product as any).free_shipping === true);
      }
      
      // Filter by variations
      if (filters.selectedVariations) {
        result = result.filter(product => 
          productMatchesVariationFilters(product, filters.selectedVariations!)
        );
      }
      
      // Apply favorites filter if selected
      if (filters.favoritesOnly) {
        // Note: This requires integration with the favorites system
        // For now we'll skip the filtering as we don't have the favorites data here
        // In a real implementation, you would filter by favorites
        console.log('Favorites filter selected, but not implemented in this hook');
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
            result.sort((a, b) => {
              const ratingA = a.rating || a.stars || 0;
              const ratingB = b.rating || b.stars || 0;
              return ratingB - ratingA;
            });
            break;
          case "newest":
            // This would require a date field, falling back to ID for now
            result.sort((a, b) => {
              const idA = Number(a.id) || 0;
              const idB = Number(b.id) || 0;
              return idB - idA;
            });
            break;
          case "popularity":
            // Sort by sales, reviews, or best seller status
            result.sort((a, b) => {
              // First check best seller status
              if (a.isBestSeller && !b.isBestSeller) return -1;
              if (!a.isBestSeller && b.isBestSeller) return 1;
              
              // Then check number of reviews
              const reviewsA = a.reviewCount || a.num_reviews || 0;
              const reviewsB = b.reviewCount || b.num_reviews || 0;
              if (reviewsA !== reviewsB) return reviewsB - reviewsA;
              
              // Then check sales
              const salesA = a.num_sales || 0;
              const salesB = b.num_sales || 0;
              return salesB - salesA;
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
      priceRange: [0, 1000],
      categories: [],
      rating: null,
      freeShipping: false,
      favoritesOnly: false,
      sortBy: "relevance",
      selectedVariations: {}
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
