
import { ZINC_API_BASE_URL, getZincHeaders, isTestMode } from "../zincCore";
import { ZincProduct } from "../types";
import { getSpecialCaseProducts } from "../utils/specialCaseHandler";
import { generateMockProductResults } from "../utils/mockResultsGenerator";
import { correctMisspellings } from "../utils/spellingCorrector";
import { isProductRelevantToSearch } from "../utils/productConverter";
import { addCategoryHints } from "../utils/termMapper";

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
  // Convert maxResults to number for processing
  const numResults = parseInt(maxResults, 10);
  
  // Handle empty queries
  if (!query || query.trim() === "") {
    console.warn("Empty search query provided");
    return [];
  }
  
  // Clean up and normalize the query
  const normalizedQuery = query.trim().toLowerCase();
  console.log(`Searching for products with query: "${normalizedQuery}", max results: ${maxResults}`);
  
  // Add category hints to improve search relevance
  const enhancedQuery = addCategoryHints(normalizedQuery);
  if (enhancedQuery !== normalizedQuery) {
    console.log(`Enhanced search query from "${normalizedQuery}" to "${enhancedQuery}"`);
  }
  
  // Special case handling (for brands etc.)
  const specialCaseResults = await getSpecialCaseProducts(enhancedQuery);
  if (specialCaseResults && specialCaseResults.length > 0) {
    console.log(`Using special case results for query: ${enhancedQuery}`);
    // Filter out irrelevant products
    const filteredResults = specialCaseResults.filter(product => 
      isProductRelevantToSearch(product, enhancedQuery)
    );
    console.log(`Filtered from ${specialCaseResults.length} to ${filteredResults.length} relevant results`);
    return filteredResults.slice(0, numResults);
  }

  // Check if we're in test mode and should use mock data
  if (isTestMode()) {
    console.log(`Using mock data for product search: ${enhancedQuery}`);
    // For special searches we want to return relevant mock data
    const mockResults = generateMockProductResults(enhancedQuery, numResults);
    console.log(`Generated ${mockResults.length} mock results for "${enhancedQuery}"`);
    
    // Filter out irrelevant products
    const filteredMockResults = mockResults.filter(product => 
      isProductRelevantToSearch(product, enhancedQuery)
    );
    console.log(`Filtered from ${mockResults.length} to ${filteredMockResults.length} relevant mock results`);
    
    return filteredMockResults;
  }
  
  try {
    // Try with original query first
    const url = `${ZINC_API_BASE_URL}/search?query=${encodeURIComponent(enhancedQuery)}&max_results=${maxResults}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getZincHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Zinc API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // If we get results, filter and return them
    if (data.results && data.results.length > 0) {
      console.log(`Found ${data.results.length} results for "${enhancedQuery}"`);
      
      // Filter out irrelevant products
      const filteredResults = data.results.filter(product => 
        isProductRelevantToSearch(product, enhancedQuery)
      );
      console.log(`Filtered from ${data.results.length} to ${filteredResults.length} relevant API results`);
      
      return filteredResults;
    }
    
    // Try with spelling correction
    const correctedQuery = correctMisspellings(enhancedQuery);
    if (correctedQuery !== enhancedQuery) {
      console.log(`No results found for "${enhancedQuery}", trying with spelling correction: "${correctedQuery}"`);
      
      const correctedUrl = `${ZINC_API_BASE_URL}/search?query=${encodeURIComponent(correctedQuery)}&max_results=${maxResults}`;
      const correctedResponse = await fetch(correctedUrl, {
        method: 'GET',
        headers: getZincHeaders()
      });
      
      if (!correctedResponse.ok) {
        throw new Error(`Zinc API error with corrected query: ${correctedResponse.status} ${correctedResponse.statusText}`);
      }
      
      const correctedData = await correctedResponse.json();
      
      if (correctedData.results && correctedData.results.length > 0) {
        console.log(`Found ${correctedData.results.length} results for corrected query "${correctedQuery}"`);
        
        // Filter out irrelevant products
        const filteredResults = correctedData.results.filter(product => 
          isProductRelevantToSearch(product, correctedQuery)
        );
        console.log(`Filtered from ${correctedData.results.length} to ${filteredResults.length} relevant corrected results`);
        
        return filteredResults;
      }
    }
    
    // If still no results, return mock data as fallback
    console.log(`No results found for "${enhancedQuery}" or "${correctedQuery}", using mock data as fallback`);
    const mockResults = generateMockProductResults(enhancedQuery, numResults);
    
    // Filter out irrelevant products
    const filteredMockResults = mockResults.filter(product => 
      isProductRelevantToSearch(product, enhancedQuery)
    );
    console.log(`Filtered from ${mockResults.length} to ${filteredMockResults.length} relevant fallback mock results`);
    
    return filteredMockResults;
    
  } catch (error) {
    console.error(`Error searching for products: ${error}`);
    
    // Return mock results in case of error
    const mockResults = generateMockProductResults(enhancedQuery, numResults);
    
    // Filter out irrelevant products
    const filteredMockResults = mockResults.filter(product => 
      isProductRelevantToSearch(product, enhancedQuery)
    );
    console.log(`Filtered from ${mockResults.length} to ${filteredMockResults.length} relevant error fallback results`);
    
    return filteredMockResults;
  }
};
