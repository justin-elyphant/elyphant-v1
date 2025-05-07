
import { ZincProduct } from '../types';
import { getImageCategory } from './categoryMapper';
import { 
  cleanupCache, 
  getFromCache, 
  saveToCache 
} from './search/searchCache';
import { 
  createMockResults,
  generateSpecialCaseResults 
} from './search/mockDataGenerator';
import { 
  isProductRelevantToSearch,
  filterProductsByRelevance 
} from './search/productRelevance';

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
 * Finds products that match the search query with support for misspelled terms
 * With caching for performance improvements
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
    
    // Clean expired cache entries occasionally
    if (Math.random() < 0.05) cleanupCache();
    
    const lowercaseQuery = safeProcessQuery(query);
    if (!lowercaseQuery) return [];
    
    // Check cache first
    const cachedResults = getFromCache(lowercaseQuery);
    if (cachedResults && Array.isArray(cachedResults) && cachedResults.length > 0) {
      console.log(`FindMatchingProducts: Using ${cachedResults.length} cached results for "${lowercaseQuery}"`);
      return cachedResults.slice(0, MAX_RESULTS);
    }
    
    console.log(`FindMatchingProducts: No cache found, generating results for "${lowercaseQuery}"`);
    
    // Special case for San Diego Padres hat searches
    if ((lowercaseQuery.includes("padres") || lowercaseQuery.includes("san diego")) && 
        (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
      const specificQuery = "san diego padres baseball hat clothing apparel";
      console.log(`FindMatchingProducts: Detected Padres hat search, using specific query "${specificQuery}"`);
      
      try {
        // Create custom results for Padres hats
        const padresHatResults = createMockResults(
          specificQuery, 
          "Baseball Team Merchandise", 
          MAX_RESULTS, 
          4.0, 
          5.0, 
          "San Diego Padres", 
          true
        );
        
        // Filter out irrelevant products
        const filteredPadresResults = padresHatResults
          .filter(product => {
            try {
              // Ensure explicit clothing category for hat searches
              if (product) {
                product.category = "Baseball Team Apparel";
                return isProductRelevantToSearch(product, specificQuery);
              }
              return false;
            } catch (err) {
              console.error("Error filtering Padres product:", err);
              return false;
            }
          })
          .slice(0, MAX_RESULTS);
        
        console.log(`FindMatchingProducts: Generated ${filteredPadresResults.length} custom Padres hat results`);
        
        // Cache the results before returning
        if (filteredPadresResults.length > 0) {
          saveToCache(lowercaseQuery, filteredPadresResults);
        }
        
        return filteredPadresResults;
      } catch (specialCaseError) {
        console.error("Error in special case handling:", specialCaseError);
        // Fall through to generic search on error
      }
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
    
    // Generic search - limit to MAX_RESULTS products for better performance
    let genericResults: ZincProduct[] = [];
    try {
      genericResults = createMockResults(
        lowercaseQuery, 
        imageCategory, 
        MAX_RESULTS, 
        3.5, 
        5.0, 
        undefined, 
        true
      );
    } catch (mockError) {
      console.error("Error creating mock results:", mockError);
      genericResults = [];
    }
    
    // Filter out irrelevant products with safeguards
    const filteredGenericResults = genericResults
      .filter(product => {
        try {
          return product && isProductRelevantToSearch(product, lowercaseQuery);
        } catch (filterError) {
          console.error("Error filtering product:", filterError);
          return false;
        }
      })
      .slice(0, MAX_RESULTS);
    
    console.log(`FindMatchingProducts: Generated ${genericResults.length} raw results, filtered to ${filteredGenericResults.length} relevant results`);
    
    // Cache the results before returning
    if (filteredGenericResults.length > 0) {
      saveToCache(lowercaseQuery, filteredGenericResults);
    }
    
    return filteredGenericResults;
  } catch (error) {
    console.error("FindMatchingProducts error:", error);
    // Return empty array on error to prevent crash
    return [];
  }
};

// Re-export key functions for backwards compatibility
export { getImageCategory } from './categoryMapper';
export { isProductRelevantToSearch } from './search/productRelevance';
export { createMockResults } from './search/mockDataGenerator';
