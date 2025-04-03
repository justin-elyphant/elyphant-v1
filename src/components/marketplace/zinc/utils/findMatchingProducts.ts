
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
    return specificProducts["nike shoes"] || [];
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
    "puma": "puma shoes"
  };
  
  // Check if query includes any of our well-known terms
  for (const term in wellKnownTerms) {
    if (normalizedQuery.includes(term)) {
      const mappedTerm = wellKnownTerms[term as keyof typeof wellKnownTerms];
      console.log(`SearchUtils: Mapping "${term}" to "${mappedTerm}"`);
      
      // If we have specific products for this term, return them
      if (specificProducts[mappedTerm]) {
        return specificProducts[mappedTerm];
      }
      
      // If not, let's create some fallback results for common searches
      if (mappedTerm === "dallas cowboys") {
        return createMockResults("Dallas Cowboys", "Sports", 12);
      } else if (mappedTerm.includes("shoes")) {
        return createMockResults(mappedTerm, "Footwear", 12);
      } else if (mappedTerm.includes("samsung") || mappedTerm.includes("iphone")) {
        return createMockResults(mappedTerm, "Electronics", 12);
      } else if (mappedTerm.includes("xbox") || mappedTerm.includes("playstation")) {
        return createMockResults(mappedTerm, "Gaming", 12);
      }
    }
  }
  
  // Check for exact matches in our specific products
  for (const key in specificProducts) {
    if (key === normalizedQuery) {
      console.log(`SearchUtils: Found exact match for "${normalizedQuery}" in specific products`);
      return specificProducts[key];
    }
  }
  
  // Check for partial matches that might be close but not exact
  for (const key in specificProducts) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      console.log(`SearchUtils: Found partial match for "${normalizedQuery}" in specific products key "${key}"`);
      return specificProducts[key];
    }
  }
  
  // Check word by word
  const queryTerms = normalizedQuery.split(' ');
  for (const key in specificProducts) {
    const keyTerms = key.split(' ');
    
    // Check if enough terms match between the query and the key
    const matchingTerms = queryTerms.filter(term => 
      keyTerms.some(keyTerm => keyTerm.includes(term) || term.includes(keyTerm))
    );
    
    if (matchingTerms.length >= Math.min(2, queryTerms.length)) {
      console.log(`SearchUtils: Found term match for "${normalizedQuery}" in specific products key "${key}"`);
      return specificProducts[key];
    }
  }
  
  // Filter products based on query
  let results = allProducts.filter(product => 
    product.title.toLowerCase().includes(normalizedQuery) || 
    (product.description && product.description.toLowerCase().includes(normalizedQuery)) ||
    (product.category && product.category.toLowerCase().includes(normalizedQuery)) ||
    (product.brand && product.brand.toLowerCase().includes(normalizedQuery))
  );
  
  // Check for brand-specific searches (like "Nike")
  if (results.length === 0 && normalizedQuery.includes('nike')) {
    console.log(`SearchUtils: Using fallback for Nike-related search`);
    return specificProducts['nike shoes'] || [];
  }
  
  // Generic fallback: if we have no results but have a common term, create mock results
  if (results.length === 0) {
    for (const term of queryTerms) {
      if (term.length > 3) { // Only consider meaningful terms
        // Create mock results for longer search terms
        const fallbackResults = createMockResults(normalizedQuery, guessCategory(normalizedQuery), 12);
        if (fallbackResults.length > 0) {
          console.log(`SearchUtils: Created ${fallbackResults.length} fallback results for "${normalizedQuery}"`);
          return fallbackResults;
        }
      }
    }
  }
  
  // If no results, return empty array instead of default items
  if (results.length === 0) {
    console.log(`SearchUtils: No matches found, returning empty array`);
    return [];
  }
  
  console.log(`SearchUtils: Returning ${results.length} results`);
  return results;
};
