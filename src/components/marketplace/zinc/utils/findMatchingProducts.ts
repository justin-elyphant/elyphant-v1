
import { ZincProduct } from '../types';
import { allProducts, specificProducts } from '../data/mockProducts';
import { createMockResults } from './mockResultsGenerator';
import { guessCategory } from './categoryUtils';

/**
 * Finds products that match the search query
 */
export const findMatchingProducts = (query: string): ZincProduct[] => {
  const lowercaseQuery = query.toLowerCase();
  
  // Normalize query - support both "Nike Shoes" and "nike shoes"
  const normalizedQuery = lowercaseQuery.trim();
  
  console.log(`SearchUtils: Searching for "${normalizedQuery}"`);
  
  // Direct matching for common searches
  if (normalizedQuery === "nike shoes" || 
      normalizedQuery === "nike shoe" || 
      (normalizedQuery.includes("nike") && normalizedQuery.includes("shoe"))) {
    console.log(`SearchUtils: Found special match for Nike Shoes`);
    // Return more products (minimum 100)
    return createMockResults("Nike Shoes", "Footwear", 100);
  }
  
  // Check for well-known brands and products
  const wellKnownTerms = {
    "dallas": "dallas cowboys",
    "cowboys": "dallas cowboys",
    "iphone": "apple iphone",
    "samsung": "samsung galaxy",
    "playstation": "sony playstation",
    "xbox": "microsoft xbox",
    "adidas": "adidas shoes",
    "puma": "puma shoes",
    "nike": "nike shoes"
  };
  
  // Check if query includes any of our well-known terms
  for (const term in wellKnownTerms) {
    if (normalizedQuery.includes(term)) {
      const mappedTerm = wellKnownTerms[term as keyof typeof wellKnownTerms];
      console.log(`SearchUtils: Mapping "${term}" to "${mappedTerm}"`);
      
      // If we have specific products for this term, return them
      if (specificProducts[mappedTerm]) {
        // For Nike, always create a larger set of results
        if (term === "nike") {
          return createMockResults("Nike Products", "Footwear", 100);
        }
        return specificProducts[mappedTerm];
      }
      
      // If not, let's create some fallback results for common searches
      if (mappedTerm === "dallas cowboys") {
        return createMockResults("Dallas Cowboys", "Sports", 100);
      } else if (mappedTerm.includes("shoes")) {
        return createMockResults(mappedTerm, "Footwear", 100);
      } else if (mappedTerm.includes("samsung") || mappedTerm.includes("iphone")) {
        return createMockResults(mappedTerm, "Electronics", 100);
      } else if (mappedTerm.includes("xbox") || mappedTerm.includes("playstation")) {
        return createMockResults(mappedTerm, "Gaming", 100);
      }
    }
  }
  
  // Generic search - always return at least 100 items
  return createMockResults(normalizedQuery, guessCategory(normalizedQuery), 100);
};
