
/**
 * Main product search service implementation with enhanced brand-first logic
 */
import { ZincProduct } from "../../types";
import { getSpecialCaseProducts } from "../../utils/specialCaseHandler";
import { isTestMode, hasValidZincToken } from "../../zincCore";
import { validateSearchQuery, enhanceSearchQuery, correctSearchQuery, getPadresHatQuery } from "./searchValidationUtils";
import { getMockResults } from "./mockResultsHandler";
import { searchZincApi } from "./zincApiService";
import { validateProductImages, filterRelevantProducts } from "./productValidationUtils";
import { filterAndSortProductsBrandFirst, generateEnhancedSearchContext } from "../../utils/search/enhancedProductFiltering";

// Track whether we've shown token error toast
let hasShownTokenError = false;

/**
 * Search for products using the Zinc API with enhanced brand-first logic
 * @param query Search query string
 * @param maxResults Maximum results to return (optional, defaults to 35 for better coverage)
 * @returns Promise with array of product results
 */
export const searchProducts = async (
  query: string,
  maxResults: string = "35"
): Promise<ZincProduct[]> => {
  // Validate query
  const normalizedQuery = validateSearchQuery(query);
  if (!normalizedQuery) {
    console.log("Invalid search query. Returning empty results.");
    return [];
  }
  
  // Convert maxResults to number for processing, ensure minimum of 35 for popular brands
  const numResults = Math.max(parseInt(maxResults, 10), 35);
  const apiMaxResults = Math.min(numResults * 2, 100).toString(); // Get more to filter from
  
  console.log(`Searching for products with query: "${normalizedQuery}", requesting ${apiMaxResults} results, returning top ${numResults}`);
  
  // Generate enhanced search context from query
  const enhancedContext = generateEnhancedSearchContext(normalizedQuery);
  console.log('Enhanced search context:', enhancedContext);
  
  // Enhanced query generation with brand-specific logic
  let enhancedQuery = enhanceSearchQuery(normalizedQuery);
  
  // Special handling for Apple brand to get electronics instead of fruit
  if (normalizedQuery.toLowerCase().includes('apple') && !normalizedQuery.toLowerCase().includes('fruit')) {
    enhancedQuery = "Apple iPhone iPad MacBook AirPods Apple Watch electronics";
    console.log(`Enhanced Apple brand search query: "${enhancedQuery}"`);
  }
  
  // Check for special case queries
  const padresHatQuery = getPadresHatQuery(normalizedQuery);
  
  // Use the appropriate query based on special cases
  let finalQuery = padresHatQuery || enhancedQuery;
  
  try {
    // Always attempt to use the real API first
    console.log(`Using Zinc API via edge function for query: "${finalQuery}"`);
    
    // Try with enhanced query first
    const apiResults = await searchZincApi(finalQuery, apiMaxResults);
    
    if (apiResults && apiResults.length > 0) {
      console.log(`Found ${apiResults.length} raw results from API`);
      
      // Ensure each product has valid images
      const validatedResults = apiResults.map(product => 
        validateProductImages(product, finalQuery)
      );
      
      // Apply brand-first filtering and sorting
      const brandFirstResults = filterAndSortProductsBrandFirst(
        validatedResults,
        finalQuery,
        {
          detectedBrands: enhancedContext.detectedBrands,
          interests: enhancedContext.interests,
          ageGroup: enhancedContext.ageInfo?.ageGroup,
          prioritizeBrands: enhancedContext.prioritizeBrands
        }
      );
      
      // Return top results
      const finalResults = brandFirstResults.slice(0, numResults);
      console.log(`Returning ${finalResults.length} filtered and sorted results`);
      return finalResults;
    }
    
    // Try with spelling correction if no results
    const correctedQuery = correctSearchQuery(finalQuery);
    if (correctedQuery !== finalQuery) {
      console.log(`No results found for "${finalQuery}", trying with spelling correction: "${correctedQuery}"`);
      
      const correctedResults = await searchZincApi(correctedQuery, apiMaxResults);
      
      if (correctedResults && correctedResults.length > 0) {
        console.log(`Found ${correctedResults.length} results for corrected query "${correctedQuery}"`);
        
        // Ensure each product has valid images
        const validatedResults = correctedResults.map(product => 
          validateProductImages(product, correctedQuery)
        );
        
        // Apply brand-first filtering and sorting
        const brandFirstResults = filterAndSortProductsBrandFirst(
          validatedResults,
          correctedQuery,
          {
            detectedBrands: enhancedContext.detectedBrands,
            interests: enhancedContext.interests,
            ageGroup: enhancedContext.ageInfo?.ageGroup,
            prioritizeBrands: enhancedContext.prioritizeBrands
          }
        );
        
        return brandFirstResults.slice(0, numResults);
      }
    }
    
    // Special case handling only if no API results were found
    const specialCaseResults = await getSpecialCaseProducts(finalQuery);
    if (specialCaseResults && specialCaseResults.length > 0) {
      console.log(`Using special case results for query: ${finalQuery}`);
      
      // Ensure each product has valid images
      const validatedResults = specialCaseResults.map(product => 
        validateProductImages(product, finalQuery)
      );
      
      const brandFirstResults = filterAndSortProductsBrandFirst(
        validatedResults,
        finalQuery,
        {
          detectedBrands: enhancedContext.detectedBrands,
          interests: enhancedContext.interests,
          ageGroup: enhancedContext.ageInfo?.ageGroup,
          prioritizeBrands: enhancedContext.prioritizeBrands
        }
      );
      
      return brandFirstResults.slice(0, numResults);
    }
    
    // Last resort - if we have no results, use mock data only as final fallback
    if (isTestMode() || !hasValidZincToken()) {
      console.log(`Using mock data as final fallback for product search: ${finalQuery}`);
      const mockResults = getMockResults(finalQuery, numResults);
      
      // Apply brand-first filtering to mock results too
      return filterAndSortProductsBrandFirst(
        mockResults,
        finalQuery,
        {
          detectedBrands: enhancedContext.detectedBrands,
          interests: enhancedContext.interests,
          ageGroup: enhancedContext.ageInfo?.ageGroup,
          prioritizeBrands: enhancedContext.prioritizeBrands
        }
      );
    }
    
    // If we reached here, we tried everything and found no results
    console.log(`No results found for "${finalQuery}" with any method`);
    return [];
    
  } catch (error) {
    console.error(`Error searching for products: ${error}`);
    
    // Only use mock results for fallback in case of errors if no real API available
    if (isTestMode() || !hasValidZincToken()) {
      const mockResults = getMockResults(finalQuery, numResults);
      
      // Apply brand-first filtering to mock results
      return filterAndSortProductsBrandFirst(
        mockResults,
        finalQuery,
        {
          detectedBrands: enhancedContext.detectedBrands,
          interests: enhancedContext.interests,
          ageGroup: enhancedContext.ageInfo?.ageGroup,
          prioritizeBrands: enhancedContext.prioritizeBrands
        }
      );
    }
    
    // Return empty array to indicate error with real API
    return [];
  }
};
