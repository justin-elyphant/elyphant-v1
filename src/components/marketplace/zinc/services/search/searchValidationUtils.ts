
/**
 * Enhanced search validation and query enhancement utilities
 * with intelligent category mapping
 */

import { getEnhancedCategorySearch, isBroadCategorySearch, extractCategoryFromQuery } from './categoryProductMapping';

// Common search term corrections
const SEARCH_CORRECTIONS: Record<string, string> = {
  "iphone": "iPhone smartphone",
  "macbook": "MacBook laptop",
  "airpods": "AirPods wireless earbuds",
  "ipad": "iPad tablet",
  "nintendo": "Nintendo Switch gaming console",
  "playstation": "PlayStation gaming console",
  "xbox": "Xbox gaming console"
};

// Brand-specific enhancements
const BRAND_ENHANCEMENTS: Record<string, string> = {
  "apple": "iPhone MacBook iPad AirPods Apple Watch",
  "samsung": "Samsung Galaxy smartphone tablet",
  "sony": "Sony PlayStation headphones camera",
  "nintendo": "Nintendo Switch games gaming",
  "microsoft": "Microsoft Xbox Surface laptop"
};

/**
 * Validate and normalize search query
 */
export const validateSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  const trimmed = query.trim();
  if (trimmed.length === 0 || trimmed.length > 200) {
    return '';
  }
  
  return trimmed;
};

/**
 * Enhanced query enhancement with category mapping
 */
export const enhanceSearchQuery = (query: string): string => {
  console.log(`Enhancing search query: "${query}"`);
  
  // First check if this is a broad category search that needs specific product mapping
  if (isBroadCategorySearch(query)) {
    const category = extractCategoryFromQuery(query);
    if (category) {
      const enhancedQuery = getEnhancedCategorySearch(category, query);
      console.log(`Category-enhanced query: "${query}" -> "${enhancedQuery}"`);
      return enhancedQuery;
    }
  }
  
  let enhancedQuery = query.toLowerCase();
  
  // Apply search corrections
  for (const [original, correction] of Object.entries(SEARCH_CORRECTIONS)) {
    if (enhancedQuery.includes(original)) {
      enhancedQuery = enhancedQuery.replace(original, correction);
      console.log(`Applied correction: ${original} -> ${correction}`);
    }
  }
  
  // Apply brand enhancements
  for (const [brand, enhancement] of Object.entries(BRAND_ENHANCEMENTS)) {
    if (enhancedQuery.includes(brand)) {
      enhancedQuery = `${enhancedQuery} ${enhancement}`;
      console.log(`Applied brand enhancement for: ${brand}`);
      break; // Only apply one brand enhancement
    }
  }
  
  // Add gift context for better results
  if (!enhancedQuery.includes('gift') && !enhancedQuery.includes('present')) {
    enhancedQuery = `${enhancedQuery} gifts`;
  }
  
  console.log(`Final enhanced query: "${query}" -> "${enhancedQuery}"`);
  return enhancedQuery;
};

/**
 * Correct common spelling mistakes
 */
export const correctSearchQuery = (query: string): string => {
  const corrections: Record<string, string> = {
    "eletronic": "electronic",
    "celphone": "cellphone",
    "compuer": "computer",
    "labtop": "laptop",
    "headfones": "headphones",
    "watche": "watch",
    "jewelery": "jewelry"
  };
  
  let corrected = query;
  for (const [wrong, right] of Object.entries(corrections)) {
    corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
  }
  
  return corrected;
};

/**
 * Special case for Padres hat searches
 */
export const getPadresHatQuery = (query: string): string | null => {
  const normalizedQuery = query.toLowerCase();
  if (normalizedQuery.includes('padres') && (normalizedQuery.includes('hat') || normalizedQuery.includes('cap'))) {
    return "San Diego Padres baseball cap hat MLB merchandise";
  }
  return null;
};
