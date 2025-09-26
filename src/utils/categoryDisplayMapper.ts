/**
 * Category Display Mapper Utility
 * 
 * Maps category search terms to clean display names using existing UNIVERSAL_CATEGORIES
 */

import { UNIVERSAL_CATEGORIES } from '@/constants/categories';

/**
 * Checks if a search term matches any category's searchTerm
 */
export const isCategorySearchTerm = (searchTerm: string): boolean => {
  if (!searchTerm) return false;
  
  return UNIVERSAL_CATEGORIES.some(category => 
    category.searchTerm === searchTerm
  );
};

/**
 * Gets the display name for a category search term
 * Returns the displayName if available, otherwise the name, or the original search term if no match
 */
export const getCategoryDisplayNameFromSearchTerm = (searchTerm: string): string => {
  if (!searchTerm) return '';
  
  const category = UNIVERSAL_CATEGORIES.find(cat => 
    cat.searchTerm === searchTerm
  );
  
  if (category) {
    return category.displayName || category.name;
  }
  
  return searchTerm;
};

/**
 * Gets the clean category name from a category value (for URL params)
 */
export const getCategoryDisplayNameFromValue = (categoryValue: string): string => {
  if (!categoryValue) return '';
  
  const category = UNIVERSAL_CATEGORIES.find(cat => 
    cat.value === categoryValue
  );
  
  if (category) {
    return category.displayName || category.name;
  }
  
  return categoryValue;
};