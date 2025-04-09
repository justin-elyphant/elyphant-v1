
/**
 * Utilities for handling mock results and fallbacks
 */
import { ZincProduct } from "../../types";
import { generateMockProductResults } from "../../utils/mockResultsGenerator";
import { validateProductImages } from "./productValidationUtils";
import { filterRelevantProducts } from "./productValidationUtils";

/**
 * Get mock results for a query when API fails or returns no results
 */
export const getMockResults = (
  query: string, 
  maxResults: number
): ZincProduct[] => {
  console.log(`Generating mock results for "${query}"`);
  
  // Generate mock products
  const mockResults = generateMockProductResults(query, maxResults);
  console.log(`Generated ${mockResults.length} mock results for "${query}"`);
  
  // Ensure each product has valid images
  const validatedMockResults = mockResults.map(product => 
    validateProductImages(product, query)
  );
  
  // Filter out irrelevant products
  return filterRelevantProducts(validatedMockResults, query, maxResults);
};
