
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
 * Finds products that match the search query with support for misspelled terms
 */
export const findMatchingProducts = (query: string): ZincProduct[] => {
  const lowercaseQuery = query.toLowerCase();
  
  // Normalize query - support both "Nike Shoes" and "nike shoes"
  const normalizedQuery = lowercaseQuery.trim();
  
  console.log(`SearchUtils: Searching for "${normalizedQuery}"`);
  
  // Handle common misspellings
  const correctedQuery = correctMisspellings(normalizedQuery);
  if (correctedQuery !== normalizedQuery) {
    console.log(`SearchUtils: Corrected "${normalizedQuery}" to "${correctedQuery}"`);
  }
  
  // Add category hints to improve search relevance
  const enhancedQuery = addCategoryHints(correctedQuery);
  if (enhancedQuery !== correctedQuery) {
    console.log(`SearchUtils: Enhanced query from "${correctedQuery}" to "${enhancedQuery}"`);
  }
  
  // Special case for San Diego Padres hat searches - explicitly use a very specific query
  if ((normalizedQuery.includes("padres") || normalizedQuery.includes("san diego")) && 
      (normalizedQuery.includes("hat") || normalizedQuery.includes("cap"))) {
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
    return filteredPadresResults;
  }
  
  // Get appropriate image category
  const imageCategory = getImageCategory(enhancedQuery);
  console.log(`SearchUtils: Using image category "${imageCategory}" for "${enhancedQuery}"`);
  
  // Check for special cases first
  const specialCaseResults = handleSpecialCases(enhancedQuery);
  if (specialCaseResults) {
    console.log(`SearchUtils: Using special case results for "${enhancedQuery}"`);
    // Filter out irrelevant products
    const filteredResults = specialCaseResults.filter(product => isProductRelevantToSearch(product, enhancedQuery));
    console.log(`SearchUtils: Filtered from ${specialCaseResults.length} to ${filteredResults.length} relevant results`);
    return filteredResults;
  }
  
  // Check for well-known terms
  const mappedTerm = findMappedTerm(enhancedQuery);
  if (mappedTerm) {
    console.log(`SearchUtils: Mapping "${enhancedQuery}" to "${mappedTerm}"`);
    
    // If we have specific products for this term, return them
    if (specificProducts[mappedTerm]) {
      // For Nike, always create a larger set of results with accurate pricing
      if (mappedTerm.includes("nike")) {
        const results = createMockResults("Nike Products", "Nike", 100, 4.0, 5.0, "Nike", true);
        // Filter out irrelevant products
        const filteredResults = results.filter(product => isProductRelevantToSearch(product, enhancedQuery));
        console.log(`SearchUtils: Filtered from ${results.length} to ${filteredResults.length} relevant Nike results`);
        return filteredResults;
      }
      
      const specificResult = specificProducts[mappedTerm];
      // Filter out irrelevant products
      const filteredSpecificResults = specificResult.filter(product => isProductRelevantToSearch(product, enhancedQuery));
      console.log(`SearchUtils: Filtered from ${specificResult.length} to ${filteredSpecificResults.length} relevant specific results`);
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
      const filteredMappedResults = mappedResults.filter(product => isProductRelevantToSearch(product, enhancedQuery));
      console.log(`SearchUtils: Filtered from ${mappedResults.length} to ${filteredMappedResults.length} relevant mapped results`);
      return filteredMappedResults;
    }
  }
  
  // Generic search - always return products with accurate pricing
  const genericResults = createMockResults(enhancedQuery, imageCategory, 100, 3.5, 5.0, undefined, true);
  
  // Filter out irrelevant products
  const filteredGenericResults = genericResults.filter(product => isProductRelevantToSearch(product, enhancedQuery));
  console.log(`SearchUtils: Filtered from ${genericResults.length} to ${filteredGenericResults.length} relevant generic results`);
  
  return filteredGenericResults;
};
