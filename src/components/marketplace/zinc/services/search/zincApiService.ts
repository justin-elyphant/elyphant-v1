
/**
 * Service for making Zinc API calls
 */
import { ZincProduct } from "../../types";
import { ZINC_API_BASE_URL, getZincHeaders, isTestMode, hasValidZincToken } from "../../zincCore";
import { generateMockSearchResults } from "../../mocks/mockSearchResults";
import { toast } from "sonner";

/**
 * Call the Zinc API to search for products
 */
export const searchZincApi = async (
  query: string,
  maxResults: string
): Promise<ZincProduct[] | null> => {
  try {
    // Check if we should use mock data
    if (isTestMode()) {
      console.log(`Using mock data for product search: ${query}`);
      return generateMockSearchResults(query, parseInt(maxResults));
    }
    
    // Verify we have a valid token before making the API call
    if (!hasValidZincToken()) {
      console.error('No valid Zinc API token found. Cannot make API request.');
      toast.error('API Token Missing', {
        description: 'Please add your Zinc API token in settings to search real products',
        duration: 5000,
      });
      return null;
    }
    
    console.log(`Making real API call to Zinc for query: "${query}", max results: ${maxResults}`);
    
    const url = `${ZINC_API_BASE_URL}/search?query=${encodeURIComponent(query)}&max_results=${maxResults}`;
    const headers = getZincHeaders();
    
    console.log('API request headers:', {
      contentType: headers['Content-Type'],
      authHeader: headers['Authorization'].substring(0, 15) + '...',
      hasToken: headers['Authorization'].length > 8
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Zinc API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // If we get results, return them
    if (data.results && data.results.length > 0) {
      console.log(`Found ${data.results.length} results from Zinc API for "${query}"`);
      return data.results;
    }
    
    // No results found
    console.log(`No results found from Zinc API for "${query}"`);
    return null;
  } catch (error) {
    console.error(`Error calling Zinc API: ${error}`);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('Network error: Failed to connect to Zinc API');
      toast.error('Connection Error', {
        description: 'Failed to connect to Zinc API. Please check your internet connection.',
        duration: 5000,
      });
    } else {
      toast.error('API Error', {
        description: 'Error connecting to Zinc API. Please try again later.',
        duration: 5000,
      });
    }
    
    throw error;
  }
};
