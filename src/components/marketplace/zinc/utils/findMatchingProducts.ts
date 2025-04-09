
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
