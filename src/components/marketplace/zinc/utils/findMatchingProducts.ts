
import { ZincProduct } from '../types';
import { getImageCategory } from './categoryMapper';
import { getZincMockProducts } from '../../services/mockProductService';

/**
 * Maximum number of results to return for better performance
 */
const MAX_RESULTS = 25;

/**
 * Safely processes a search query by handling null/undefined values
 * and trimming excess whitespace
 */
const safeProcessQuery = (query: string | null | undefined): string => {
  if (!query) return '';
  return query.trim().toLowerCase();
};

/**
 * Finds products that match the search query
 * Uses stable mock data for consistent UI testing
 * 
 * @param query The search query string
 * @returns Array of matching products
 */
export const findMatchingProducts = (query: string): ZincProduct[] => {
  try {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      console.log("FindMatchingProducts: Empty query, returning empty results");
      return [];
    }
    
    console.log(`FindMatchingProducts: Starting search for "${query}"`);
    
    const lowercaseQuery = safeProcessQuery(query);
    if (!lowercaseQuery) return [];
    
    console.log(`FindMatchingProducts: Using mock data for "${lowercaseQuery}"`);
    
    // Special case for San Diego Padres hat searches
    if ((lowercaseQuery.includes("padres") || lowercaseQuery.includes("san diego")) && 
        (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
      const specificQuery = "san diego padres baseball hat";
      console.log(`FindMatchingProducts: Detected Padres hat search, using specific query "${specificQuery}"`);
      
      // Get mock results with the specific query
      const padresResults = getZincMockProducts(specificQuery);
      console.log(`FindMatchingProducts: Generated ${padresResults.length} Padres hat results`);
      return padresResults;
    }
    
    // Get appropriate image category
    let imageCategory;
    try {
      imageCategory = getImageCategory(lowercaseQuery);
    } catch (categoryError) {
      console.error("Error getting image category:", categoryError);
      imageCategory = "General";
    }
    
    console.log(`FindMatchingProducts: Using category "${imageCategory}" for query "${lowercaseQuery}"`);
    
    // Get results from mock data
    const results = getZincMockProducts(lowercaseQuery, MAX_RESULTS);
    console.log(`FindMatchingProducts: Generated ${results.length} results for "${lowercaseQuery}"`);
    
    return results;
  } catch (error) {
    console.error("FindMatchingProducts error:", error);
    // Return empty array on error to prevent crash
    return [];
  }
};

// Re-export key functions for backwards compatibility
export { getImageCategory } from './categoryMapper';
