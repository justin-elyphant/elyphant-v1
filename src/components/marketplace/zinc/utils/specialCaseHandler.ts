
import { ZincProduct } from '../types';
import { createMockResults } from './mockResultsGenerator';

/**
 * Handles special case searches to return appropriate mock results
 */
export const handleSpecialCases = (query: string): ZincProduct[] | null => {
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Special handling for MacBook misspellings
  if (lowercaseQuery.includes("mackbook") || 
      (lowercaseQuery.includes("mac") && lowercaseQuery.includes("book")) ||
      (lowercaseQuery.includes("apple") && lowercaseQuery.includes("mackbook"))) {
    console.log(`SearchUtils: Found special match for Apple MacBook`);
    return createMockResults("Apple MacBook", "MacBook", 100, 4.5, 5.0, "Apple", true);
  }
  
  // Direct matching for common searches
  if (lowercaseQuery === "nike shoes" || 
      lowercaseQuery === "nike shoe" || 
      (lowercaseQuery.includes("nike") && lowercaseQuery.includes("shoe"))) {
    console.log(`SearchUtils: Found special match for Nike Shoes`);
    return createMockResults("Nike Shoes", "Footwear", 100, 4.5, 5.0, "Nike", true);
  }
  
  // Apple products special handling
  if (lowercaseQuery.includes("apple") || 
      lowercaseQuery.includes("iphone") || 
      lowercaseQuery.includes("macbook") || 
      lowercaseQuery.includes("ipad")) {
    console.log(`SearchUtils: Found special match for Apple products`);
    return createMockResults("Apple Products", "Apple", 100, 4.2, 5.0, "Apple", true);
  }
  
  return null;
};

/**
 * Creates appropriate mock results for a mapped term
 */
export const createResultsForMappedTerm = (mappedTerm: string): ZincProduct[] | null => {
  if (mappedTerm === "dallas cowboys") {
    return createMockResults(mappedTerm, "Sports", 100, 4.3, 5.0, "Sports", true);
  } 
  
  if (mappedTerm.includes("shoes")) {
    return createMockResults(mappedTerm, "Footwear", 100, 4.1, 5.0, mappedTerm.split(' ')[0], true);
  } 
  
  if (mappedTerm.includes("samsung") || mappedTerm.includes("iphone")) {
    return createMockResults(
      mappedTerm, 
      mappedTerm.includes("samsung") ? "Samsung" : "Apple", 
      100, 
      4.4, 
      5.0, 
      mappedTerm.split(' ')[0], 
      true
    );
  } 
  
  if (mappedTerm.includes("xbox") || mappedTerm.includes("playstation")) {
    return createMockResults(mappedTerm, "Gaming", 100, 4.7, 5.0, mappedTerm.split(' ')[0], true);
  }
  
  return null;
};
