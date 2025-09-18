
import { useState, useEffect, useMemo } from "react";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { analyzeSearchContext, generateDynamicFilters, SearchContext, DynamicFilterOptions } from "@/services/marketplace/searchAnalysisService";

// Re-export types for external use
export type { SearchContext, DynamicFilterOptions } from "@/services/marketplace/searchAnalysisService";

export interface DynamicFilterState {
  priceRange: [number, number];
  selectedBrands: string[];
  selectedCategories: string[];
  selectedAttributes: Record<string, string[]>;
  selectedOccasions: string[];
  selectedDemographics: string[];
  rating: number | null;
  freeShipping: boolean;
  favoritesOnly: boolean;
  sortBy: string;
}

// Helper function to ensure boolean conversion
const convertToBoolean = (value: any): boolean => {
  if (typeof value === 'string') {
    return value === 'true';
  }
  return Boolean(value);
};

export const useDynamicFilters = (products: Product[], searchTerm: string = "") => {
  const isMobile = useIsMobile();
  
  // Analyze search context
  const searchContext = useMemo(() => {
    return analyzeSearchContext(searchTerm);
  }, [searchTerm]);
  
  // Generate dynamic filter options
  const filterOptions = useMemo(() => {
    return generateDynamicFilters(products, searchContext);
  }, [products, searchContext]);
  
  // Auto-apply smart defaults based on search context
  const smartDefaults = useMemo(() => {
    const defaults: Partial<DynamicFilterState> = {};
    
    // Auto-select gender if detected
    if (searchContext.gender && !searchContext.isGiftContext) {
      defaults.selectedDemographics = [searchContext.gender];
    }
    
    // Auto-select age group for direct searches
    if (searchContext.ageGroup && searchTerm.toLowerCase().includes(searchContext.ageGroup)) {
      defaults.selectedDemographics = [...(defaults.selectedDemographics || []), searchContext.ageGroup];
    }
    
    // Auto-select product category if strongly indicated
    if (searchContext.productCategory && searchTerm.toLowerCase().includes(searchContext.productCategory.toLowerCase())) {
      defaults.selectedCategories = [searchContext.productCategory];
    }
    
    return defaults;
  }, [searchContext, searchTerm]);
  
  // Initialize filter state with smart defaults
  const [filters, setFilters] = useState<DynamicFilterState>({
    priceRange: [0, 1000],
    selectedBrands: [],
    selectedCategories: [],
    selectedAttributes: {},
    selectedOccasions: [],
    selectedDemographics: [],
    rating: null,
    freeShipping: false,
    favoritesOnly: false,
    sortBy: "relevance"
  });
  
  // Apply smart defaults when search context changes
  useEffect(() => {
    if (Object.keys(smartDefaults).length > 0) {
      setFilters(prev => ({
        ...prev,
        ...smartDefaults
      }));
    }
  }, [smartDefaults]);
  
  // Update price range when products change
  useEffect(() => {
    if (filterOptions.priceRanges.length > 0) {
      const maxPrice = Math.max(...filterOptions.priceRanges.map(r => r.max === Infinity ? 1000 : r.max));
      setFilters(prev => ({
        ...prev,
        priceRange: [0, maxPrice]
      }));
    }
  }, [filterOptions.priceRanges]);
  
  // Apply filters to products
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Apply brand filters
    if (filters.selectedBrands.length > 0) {
      result = result.filter(product => 
        product.brand && filters.selectedBrands.includes(product.brand)
      );
    }
    
    // Apply category filters
    if (filters.selectedCategories.length > 0) {
      result = result.filter(product => 
        product.category && filters.selectedCategories.includes(product.category)
      );
    }
    
    // Apply price range filter
    result = result.filter(product => 
      product.price >= filters.priceRange[0] && 
      product.price <= filters.priceRange[1]
    );
    
    // Apply rating filter
    if (filters.rating) {
      result = result.filter(product => {
        const productRating = product.rating || 0;
        return productRating >= filters.rating!;
      });
    }
    
    // Apply free shipping filter
    if (filters.freeShipping) {
      result = result.filter(product => (product as any).free_shipping === true);
    }
    
    // Apply favorites filter
    if (filters.favoritesOnly) {
      // This would need integration with favorites system
      console.log('Favorites filter applied but not implemented');
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        // Sort by ID as proxy for newest
        result.sort((a, b) => {
          const idA = Number(a.id) || 0;
          const idB = Number(b.id) || 0;
          return idB - idA;
        });
        break;
      case "popularity":
        result.sort((a, b) => {
          const reviewsA = a.reviewCount || 0;
          const reviewsB = b.reviewCount || 0;
          return reviewsB - reviewsA;
        });
        break;
    }
    
    return result;
  }, [products, filters]);
  
  const updateFilter = <K extends keyof DynamicFilterState>(
    filterType: K, 
    value: DynamicFilterState[K]
  ) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      // Ensure boolean types for specific properties
      if (filterType === 'freeShipping' || filterType === 'favoritesOnly') {
        newFilters[filterType] = convertToBoolean(value) as DynamicFilterState[K];
      } else {
        newFilters[filterType] = value;
      }
      
      return newFilters;
    });
  };
  
  // Apply multiple filters at once (for smart suggestions)
  const applyFilters = (newFilters: Partial<DynamicFilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };
  
  // Remove specific filter value
  const removeFilter = <K extends keyof DynamicFilterState>(
    filterType: K,
    value?: any
  ) => {
    if (value !== undefined) {
      updateFilter(filterType, value);
    } else {
      // Reset to default value
      const defaultValues: Record<string, any> = {
        priceRange: [0, 1000],
        selectedBrands: [],
        selectedCategories: [],
        selectedAttributes: {},
        selectedOccasions: [],
        selectedDemographics: [],
        rating: null,
        freeShipping: false,
        favoritesOnly: false,
        sortBy: "relevance"
      };
      updateFilter(filterType, defaultValues[filterType] as DynamicFilterState[K]);
    }
  };
  
  const resetFilters = () => {
    const maxPrice = filterOptions.priceRanges.length > 0 
      ? Math.max(...filterOptions.priceRanges.map(r => r.max === Infinity ? 1000 : r.max))
      : 1000;
      
    setFilters({
      priceRange: [0, maxPrice],
      selectedBrands: [],
      selectedCategories: [],
      selectedAttributes: {},
      selectedOccasions: [],
      selectedDemographics: [],
      rating: null,
      freeShipping: false,
      favoritesOnly: false,
      sortBy: "relevance"
    });
  };
  
  // Check if filters should be prioritized based on search context
  const shouldShowBrandFilters = filterOptions.brands.length > 1;
  const shouldShowDemographicFilters = searchContext.gender || searchContext.ageGroup || searchContext.isGiftContext;
  const shouldShowOccasionFilters = searchContext.occasion || searchContext.isGiftContext;
  const shouldShowAttributeFilters = Object.keys(filterOptions.attributes).length > 0;
  
  return {
    filters,
    filteredProducts,
    filterOptions,
    searchContext,
    updateFilter,
    applyFilters,
    removeFilter,
    resetFilters,
    isMobile,
    // UI guidance flags
    shouldShowBrandFilters,
    shouldShowDemographicFilters,
    shouldShowOccasionFilters,
    shouldShowAttributeFilters
  };
};
