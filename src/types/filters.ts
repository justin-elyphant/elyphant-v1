/**
 * Shared filter types for marketplace components
 * Consolidated from useDynamicFilters and useAdvancedFilters
 */

// Sort options
export type SortByOption = 'relevance' | 'price-low' | 'price-high' | 'rating' | 'newest' | 'popularity';
export type AvailabilityOption = 'all' | 'in-stock' | 'pre-order';

// Dynamic filter types
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

// Advanced filter types (legacy compatibility)
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

// Alias for backward compatibility
export type DynamicFiltersState = DynamicFilterState;
