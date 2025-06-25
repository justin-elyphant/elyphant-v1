
/**
 * Main product search service implementation with enhanced brand-first logic
 */
import { ZincProduct } from "../../types";
import { getSpecialCaseProducts } from "../../utils/specialCaseHandler";
import { isTestMode, hasValidZincToken } from "../../zincCore";
import { validateSearchQuery, enhanceSearchQuery, correctSearchQuery, getPadresHatQuery } from "./searchValidationUtils";
import { getMockResults } from "./mockResultsHandler";
import { searchZincApi } from "./zincApiService";
import { validateProductImages, filterRelevantProducts, filterProductsByPrice } from "./productValidationUtils";
import { filterAndSortProductsBrandFirst, generateEnhancedSearchContext } from "../../utils/search/enhancedProductFiltering";

// Track whether we've shown token error toast
let hasShownTokenError = false;

/**
 * Search for products using the Zinc API with enhanced brand-first logic and price filtering
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
  
  // Generate enhanced search context from query
  const enhancedContext = generateEnhancedSearchContext(normalizedQuery);
  console.log('Enhanced search context:', enhancedContext);
  
  // Enhance query with category hints and brand-first logic
  const enhancedQuery = enhanceSearchQuery(normalizedQuery);
  
  // Check for special case queries
  const padresHatQuery = getPadresHatQuery(normalizedQuery);
  
  // Use the appropriate query based on special cases
  let finalQuery = padresHatQuery || enhancedQuery;
  
  try {
    // Always attempt to use the real API first if we have a token
    if (hasValidZincToken()) {
      console.log(`Using real Zinc API for query: "${finalQuery}"`);
      
      // Try with original query first
      const apiResults = await searchZincApi(finalQuery, maxResults);
      
      if (apiResults && apiResults.length > 0) {
        // FIRST: Filter out products with invalid pricing
        const validPricedResults = filterProductsByPrice(apiResults);
        
        if (validPricedResults.length === 0) {
          console.log(`All API results filtered out due to invalid pricing for query: "${finalQuery}"`);
          // Try with spelling correction if no valid-priced products found
          const correctedQuery = correctSearchQuery(finalQuery);
          if (correctedQuery !== finalQuery) {
            return searchProducts(correctedQuery, maxResults);
          }
          // Fall back to other methods if no correction available
        } else {
          // Ensure each product has valid images
          const validatedResults = validPricedResults.map(product => 
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
          return brandFirstResults.slice(0, numResults);
        }
      }
      
      // Try with spelling correction
      const correctedQuery = correctSearchQuery(finalQuery);
      if (correctedQuery !== finalQuery) {
        console.log(`No valid-priced results found for "${finalQuery}", trying with spelling correction: "${correctedQuery}"`);
        
        const correctedResults = await searchZincApi(correctedQuery, maxResults);
        
        if (correctedResults && correctedResults.length > 0) {
          // Filter out products with invalid pricing
          const validPricedResults = filterProductsByPrice(correctedResults);
          
          if (validPricedResults.length > 0) {
            console.log(`Found ${validPricedResults.length} valid-priced results for corrected query "${correctedQuery}"`);
            
            // Ensure each product has valid images
            const validatedResults = validPricedResults.map(product => 
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
      }
    }
    
    // Special case handling (for brands etc.) only if no API results were found
    const specialCaseResults = await getSpecialCaseProducts(finalQuery);
    if (specialCaseResults && specialCaseResults.length > 0) {
      console.log(`Using special case results for query: ${finalQuery}`);
      
      // Filter out products with invalid pricing
      const validPricedResults = filterProductsByPrice(specialCaseResults);
      
      if (validPricedResults.length > 0) {
        // Ensure each product has valid images
        const validatedResults = validPricedResults.map(product => 
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
        
        return brandFirstResults.slice(0, numResults);
      }
    }
    
    // Last resort - if we have no token or if set to test mode, use mock data
    if (!hasValidZincToken() || isTestMode()) {
      console.log(`Using mock data for product search: ${finalQuery}`);
      const mockResults = getMockResults(finalQuery, numResults);
      
      // Filter out products with invalid pricing (though mock should have valid prices)
      const validPricedResults = filterProductsByPrice(mockResults);
      
      // Apply brand-first filtering to mock results too
      return filterAndSortProductsBrandFirst(
        validPricedResults,
        finalQuery,
        {
          detectedBrands: enhancedContext.detectedBrands,
          interests: enhancedContext.interests,
          ageGroup: enhancedContext.ageInfo?.ageGroup,
          prioritizeBrands: enhancedContext.prioritizeBrands
        }
      );
    }
    
    // If we reached here, we tried everything and found no valid-priced results
    console.log(`No valid-priced results found for "${finalQuery}" with any method`);
    return [];
    
  } catch (error) {
    console.error(`Error searching for products: ${error}`);
    
    // Only use mock results for fallback in case of errors
    if (isTestMode() || !hasValidZincToken()) {
      const mockResults = getMockResults(finalQuery, numResults);
      
      // Filter out products with invalid pricing
      const validPricedResults = filterProductsByPrice(mockResults);
      
      // Apply brand-first filtering to mock results
      return filterAndSortProductsBrandFirst(
        validPricedResults,
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
