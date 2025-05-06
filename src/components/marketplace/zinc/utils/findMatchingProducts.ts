
import { ZincProduct } from '../types';
import { allProducts, specificProducts } from '../data/mockProducts';
import { createMockResults } from './mockResultsGenerator';
import { guessCategory } from './categoryUtils';
import { getImageCategory } from './categoryMapper';
import { correctMisspellings } from './spellingCorrector';
import { findMappedTerm, addCategoryHints } from './termMapper';
import { handleSpecialCases, createResultsForMappedTerm } from './specialCaseHandler';
import { isProductRelevantToSearch } from './productConverter';

/**
 * Cache to store recently searched products to improve performance
 */
const searchCache: Record<string, { timestamp: number, results: ZincProduct[] }> = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Cleans up old cache entries
 */
const cleanupCache = () => {
  const now = Date.now();
  Object.keys(searchCache).forEach(key => {
    if (now - searchCache[key].timestamp > CACHE_EXPIRY) {
      delete searchCache[key];
    }
  });
};

/**
 * Finds products that match the search query with support for misspelled terms
 * With caching for performance improvements
 */
export const findMatchingProducts = (query: string): ZincProduct[] => {
  // Clean expired cache entries occasionally
  if (Math.random() < 0.1) cleanupCache();
  
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Check cache first
  if (searchCache[lowercaseQuery] && 
      Date.now() - searchCache[lowercaseQuery].timestamp < CACHE_EXPIRY) {
    console.log(`Using cached results for "${lowercaseQuery}"`);
    return searchCache[lowercaseQuery].results;
  }
  
  console.log(`SearchUtils: Searching for "${lowercaseQuery}"`);
  
  // Handle common misspellings
  const correctedQuery = correctMisspellings(lowercaseQuery);
  if (correctedQuery !== lowercaseQuery) {
    console.log(`SearchUtils: Corrected "${lowercaseQuery}" to "${correctedQuery}"`);
  }
  
  // Add category hints to improve search relevance
  const enhancedQuery = addCategoryHints(correctedQuery);
  if (enhancedQuery !== correctedQuery) {
    console.log(`SearchUtils: Enhanced query from "${correctedQuery}" to "${enhancedQuery}"`);
  }
  
  // Special case for San Diego Padres hat searches
  if ((lowercaseQuery.includes("padres") || lowercaseQuery.includes("san diego")) && 
      (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
    const specificQuery = "san diego padres baseball hat clothing apparel";
    console.log(`SearchUtils: Using specific query for Padres hat: "${specificQuery}"`);
    
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
    
    console.log(`SearchUtils: Generated ${filteredPadresResults.length} custom Padres hat results`);
    
    // Cache the results before returning
    searchCache[lowercaseQuery] = {
      timestamp: Date.now(),
      results: filteredPadresResults
    };
    
    return filteredPadresResults;
  }
  
  // Get appropriate image category
  const imageCategory = getImageCategory(enhancedQuery);
  
  // Check for special cases first
  const specialCaseResults = handleSpecialCases(enhancedQuery);
  if (specialCaseResults) {
    console.log(`SearchUtils: Using special case results for "${enhancedQuery}"`);
    
    // Filter out irrelevant products
    const filteredResults = specialCaseResults.filter(product => 
      isProductRelevantToSearch(product, enhancedQuery)
    );
    
    console.log(`SearchUtils: Filtered from ${specialCaseResults.length} to ${filteredResults.length} relevant results`);
    
    // Cache the results before returning
    searchCache[lowercaseQuery] = {
      timestamp: Date.now(),
      results: filteredResults
    };
    
    return filteredResults;
  }
  
  // Check for well-known terms
  const mappedTerm = findMappedTerm(enhancedQuery);
  if (mappedTerm) {
    console.log(`SearchUtils: Mapping "${enhancedQuery}" to "${mappedTerm}"`);
    
    // If we have specific products for this term, return them
    if (specificProducts[mappedTerm]) {
      // For Nike, create a larger set of results with accurate pricing
      if (mappedTerm.includes("nike")) {
        const results = createMockResults("Nike Products", "Nike", 50, 4.0, 5.0, "Nike", true);
        
        // Filter out irrelevant products - limit to 50 max to improve performance
        const filteredResults = results
          .filter(product => isProductRelevantToSearch(product, enhancedQuery))
          .slice(0, 50);
        
        console.log(`SearchUtils: Filtered to ${filteredResults.length} relevant Nike results`);
        
        // Cache the results before returning
        searchCache[lowercaseQuery] = {
          timestamp: Date.now(),
          results: filteredResults
        };
        
        return filteredResults;
      }
      
      const specificResult = specificProducts[mappedTerm];
      // Filter out irrelevant products
      const filteredSpecificResults = specificResult.filter(product => 
        isProductRelevantToSearch(product, enhancedQuery)
      );
      
      // Cache the results before returning
      searchCache[lowercaseQuery] = {
        timestamp: Date.now(),
        results: filteredSpecificResults
      };
      
      return filteredSpecificResults;
    }
    
    // Create custom results for mapped terms
    const mappedResults = createResultsForMappedTerm(mappedTerm);
    if (mappedResults) {
      // Ensure each product has a valid image
      mappedResults.forEach(product => {
        if (!product.image) {
          product.image = "/placeholder.svg";
        }
        if (!product.images || product.images.length === 0) {
          product.images = [product.image];
        }
      });
      
      // Filter out irrelevant products
      const filteredMappedResults = mappedResults.filter(product => 
        isProductRelevantToSearch(product, enhancedQuery)
      );
      
      // Cache the results before returning
      searchCache[lowercaseQuery] = {
        timestamp: Date.now(),
        results: filteredMappedResults
      };
      
      return filteredMappedResults;
    }
  }
  
  // Generic search - limit to 50 products max for better performance
  const genericResults = createMockResults(enhancedQuery, imageCategory, 50, 3.5, 5.0, undefined, true);
  
  // Filter out irrelevant products
  const filteredGenericResults = genericResults
    .filter(product => isProductRelevantToSearch(product, enhancedQuery))
    .slice(0, 50);
  
  console.log(`SearchUtils: Generated ${filteredGenericResults.length} relevant generic results`);
  
  // Cache the results before returning
  searchCache[lowercaseQuery] = {
    timestamp: Date.now(),
    results: filteredGenericResults
  };
  
  return filteredGenericResults;
};
