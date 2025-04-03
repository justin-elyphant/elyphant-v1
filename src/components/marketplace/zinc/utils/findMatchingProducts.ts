
import { ZincProduct } from '../types';
import { allProducts, specificProducts } from '../data/mockProducts';
import { createMockResults } from './mockResultsGenerator';
import { guessCategory } from './categoryUtils';
import { getImageCategory } from './categoryMapper';
import { correctMisspellings } from './spellingCorrector';
import { findMappedTerm } from './termMapper';
import { handleSpecialCases, createResultsForMappedTerm } from './specialCaseHandler';

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
  
  // Get appropriate image category
  const imageCategory = getImageCategory(correctedQuery);
  console.log(`SearchUtils: Using image category "${imageCategory}" for "${correctedQuery}"`);
  
  // Check for special cases first
  const specialCaseResults = handleSpecialCases(correctedQuery);
  if (specialCaseResults) {
    return specialCaseResults;
  }
  
  // Check for well-known terms
  const mappedTerm = findMappedTerm(correctedQuery);
  if (mappedTerm) {
    console.log(`SearchUtils: Mapping "${correctedQuery}" to "${mappedTerm}"`);
    
    // If we have specific products for this term, return them
    if (specificProducts[mappedTerm]) {
      // For Nike, always create a larger set of results with accurate pricing
      if (mappedTerm.includes("nike")) {
        return createMockResults("Nike Products", "Nike", 100, 4.0, 5.0, "Nike", true);
      }
      return specificProducts[mappedTerm];
    }
    
    // Create custom results for mapped terms
    const mappedResults = createResultsForMappedTerm(mappedTerm);
    if (mappedResults) {
      return mappedResults;
    }
  }
  
  // Generic search - always return products with accurate pricing
  return createMockResults(correctedQuery, imageCategory, 100, 3.5, 5.0, undefined, true);
};
