
/**
 * Main product search service implementation
 */
import { ZincProduct } from "../../types";
import { getSpecialCaseProducts } from "../../utils/specialCaseHandler";
import { isTestMode, hasValidZincToken } from "../../zincCore";
import { validateSearchQuery, enhanceSearchQuery, correctSearchQuery, getPadresHatQuery } from "./searchValidationUtils";
import { getMockResults } from "./mockResultsHandler";
import { searchZincApi } from "./zincApiService";
import { validateProductImages, filterRelevantProducts } from "./productValidationUtils";

// Track whether we've shown token error toast
let hasShownTokenError = false;

/**
 * Search for products using the Zinc API
 * @param query Search query string
 * @param maxResults Maximum results to return (optional, defaults to 10)
 * @returns Promise with array of product results
 */
export const searchProducts = async (
  query: string,
  maxResults: string = "10"
): Promise<ZincProduct[]> => {
  // Validate query
  const normalizedQuery = validateSearchQuery(query);
  if (!normalizedQuery) {
    console.log("Invalid search query. Returning empty results.");
    return [];
  }
  
  // Convert maxResults to number for processing
  const numResults = parseInt(maxResults, 10);
  
  console.log(`Searching for products with query: "${normalizedQuery}", max results: ${maxResults}`);
  
  // Enhance query with category hints
  const enhancedQuery = enhanceSearchQuery(normalizedQuery);
  
  // Check for special case queries
  const padresHatQuery = getPadresHatQuery(normalizedQuery);
  
  // Use the appropriate query based on special cases
  let finalQuery = padresHatQuery || enhancedQuery;
  
  // Special case handling (for brands etc.)
  const specialCaseResults = await getSpecialCaseProducts(finalQuery);
  if (specialCaseResults && specialCaseResults.length > 0) {
    console.log(`Using special case results for query: ${finalQuery}`);
    
    // Ensure each product has valid images
    const validatedResults = specialCaseResults.map(product => 
      validateProductImages(product, finalQuery)
    );
    
    // Filter and return relevant results
    return filterRelevantProducts(validatedResults, finalQuery, numResults);
  }
  
  // If we don't have a valid token, don't try to make API calls - go straight to mock data
  if (!hasValidZincToken()) {
    console.log(`No valid Zinc API token. Using mock data for: ${finalQuery}`);
    return getMockResults(finalQuery, numResults);
  }

  // Check if we're in test mode and should use mock data
  if (isTestMode()) {
    console.log(`Using mock data for product search: ${finalQuery}`);
    return getMockResults(finalQuery, numResults);
  }
  
  try {
    // Try with original query first
    const apiResults = await searchZincApi(finalQuery, maxResults);
    
    if (apiResults && apiResults.length > 0) {
      // Ensure each product has valid images
      const validatedResults = apiResults.map(product => 
        validateProductImages(product, finalQuery)
      );
      
      // Filter and return relevant results
      return filterRelevantProducts(validatedResults, finalQuery, numResults);
    }
    
    // Try with spelling correction
    const correctedQuery = correctSearchQuery(finalQuery);
    if (correctedQuery !== finalQuery) {
      console.log(`No results found for "${finalQuery}", trying with spelling correction: "${correctedQuery}"`);
      
      const correctedResults = await searchZincApi(correctedQuery, maxResults);
      
      if (correctedResults && correctedResults.length > 0) {
        console.log(`Found ${correctedResults.length} results for corrected query "${correctedQuery}"`);
        
        // Ensure each product has valid images
        const validatedResults = correctedResults.map(product => 
          validateProductImages(product, correctedQuery)
        );
        
        // Filter and return relevant results
        return filterRelevantProducts(validatedResults, correctedQuery, numResults);
      }
    }
    
    // If still no results, return mock data as fallback
    console.log(`No results found for "${finalQuery}" or "${correctedQuery}", using mock data as fallback`);
    return getMockResults(finalQuery, numResults);
    
  } catch (error) {
    console.error(`Error searching for products: ${error}`);
    
    // Return mock results in case of error
    return getMockResults(finalQuery, numResults);
  }
};
