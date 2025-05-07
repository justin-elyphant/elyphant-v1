
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
 * Finds products that match the search query with support for misspelled terms
 * With caching for performance improvements
 * 
 * @param query The search query string
 * @returns Array of matching products
 */
export const findMatchingProducts = (query: string): ZincProduct[] => {
  try {
    if (!query || query.trim() === '') {
      console.log("FindMatchingProducts: Empty query, returning empty results");
      return [];
    }
    
    console.log(`FindMatchingProducts: Starting search for "${query}"`);
    
    // Clean expired cache entries occasionally
    if (Math.random() < 0.1) cleanupCache();
    
    const lowercaseQuery = query.toLowerCase().trim();
    
    // Check cache first
    const cachedResults = getFromCache(lowercaseQuery);
    if (cachedResults) {
      console.log(`FindMatchingProducts: Using ${cachedResults.length} cached results for "${lowercaseQuery}"`);
      return cachedResults;
    }
    
    console.log(`FindMatchingProducts: No cache found, generating results for "${lowercaseQuery}"`);
    
    // Special case for San Diego Padres hat searches
    if ((lowercaseQuery.includes("padres") || lowercaseQuery.includes("san diego")) && 
        (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
      const specificQuery = "san diego padres baseball hat clothing apparel";
      console.log(`FindMatchingProducts: Detected Padres hat search, using specific query "${specificQuery}"`);
      
      // Create custom results for Padres hats
      const padresHatResults = createMockResults(
        specificQuery, 
        "Baseball Team Merchandise", 
        20, 
        4.0, 
        5.0, 
        "San Diego Padres", 
        true
      );
      
      // Filter out irrelevant products
      const filteredPadresResults = padresHatResults.filter(product => {
        // Ensure explicit clothing category for hat searches
        product.category = "Baseball Team Apparel";
        return isProductRelevantToSearch(product, specificQuery);
      });
      
      console.log(`FindMatchingProducts: Generated ${filteredPadresResults.length} custom Padres hat results`);
      
      // Cache the results before returning
      saveToCache(lowercaseQuery, filteredPadresResults);
      
      return filteredPadresResults;
    }
    
    // Get appropriate image category
    const imageCategory = getImageCategory(lowercaseQuery);
    console.log(`FindMatchingProducts: Using category "${imageCategory}" for query "${lowercaseQuery}"`);
    
    // Generic search - limit to 25 products for better performance (was 50)
    const genericResults = createMockResults(lowercaseQuery, imageCategory, 25, 3.5, 5.0, undefined, true);
    
    // Filter out irrelevant products
    const filteredGenericResults = genericResults
      .filter(product => isProductRelevantToSearch(product, lowercaseQuery))
      .slice(0, 25); // Further limit results for better performance
    
    console.log(`FindMatchingProducts: Generated ${genericResults.length} raw results, filtered to ${filteredGenericResults.length} relevant results`);
    
    // Cache the results before returning
    saveToCache(lowercaseQuery, filteredGenericResults);
    
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
