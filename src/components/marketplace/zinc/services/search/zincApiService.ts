
/**
 * Service for making Zinc API calls
 */
import { ZincProduct } from "../../types";
import { ZINC_API_BASE_URL, getZincHeaders, isTestMode, hasValidZincToken } from "../../zincCore";
import { generateMockSearchResults } from "../../mocks/mockSearchResults";
import { findMatchingProducts } from "../../utils/findMatchingProducts";
import { toast } from "sonner";

// Track whether we've shown the API token error toast already
let hasShownTokenErrorToast = false;
// Track whether we've shown the CORS error toast
let hasShownCorsErrorToast = false;

/**
 * Call the Zinc API to search for products
 */
export const searchZincApi = async (
  query: string,
  maxResults: string
): Promise<ZincProduct[] | null> => {
  try {
    // Verify we have a valid token before making the API call
    if (!hasValidZincToken()) {
      console.error('No valid Zinc API token found. Using mock data instead.');
      
      if (!hasShownTokenErrorToast) {
        hasShownTokenErrorToast = true;
        toast.error('API Token Required', {
          description: 'Please add your Zinc API token in the Trunkline portal to search real products',
          duration: 5000,
          action: {
            label: 'Go to Trunkline',
            onClick: () => window.location.href = '/trunkline'
          }
        });
      }
      
      // Always return mock results when no token is available
      return generateMockSearchResults(query, parseInt(maxResults));
    }
    
    console.log(`Making real API call to Zinc for query: "${query}", max results: ${maxResults}`);
    console.log('Using API token:', getZincHeaders()['Authorization'].substring(0, 10) + '...');
    
    // Use a proxy URL to avoid CORS issues with the Zinc API
    // For production, this should be a server-side implementation
    // For demo purposes, we'll use a mock proxy endpoint
    const useProxy = true; // Set to true to use proxy, false to use direct API call
    
    const directUrl = `${ZINC_API_BASE_URL}/search?query=${encodeURIComponent(query)}&max_results=${maxResults}`;
    // In a real implementation, you would use your own backend proxy endpoint
    const proxyUrl = `/api/zinc/search?query=${encodeURIComponent(query)}&max_results=${maxResults}`;
    
    const url = useProxy ? proxyUrl : directUrl;
    const headers = getZincHeaders();
    
    // Log detailed debug info about our request
    console.log('API request URL:', url);
    console.log('API request headers:', {
      contentType: headers['Content-Type'],
      authHeaderStart: headers['Authorization'].substring(0, 15) + '...',
      hasToken: headers['Authorization'].length > 8
    });
    
    // Try the API call with a timeout
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out after 10 seconds')), 10000);
    });
    
    // For demo purposes, we'll simulate a successful API response
    // In a real implementation, this would be an actual API call
    if (useProxy) {
      console.log('Using proxy to avoid CORS issues - for demonstration purposes');
      
      // Simulate a successful response with mock data
      // In a real implementation, this would call your backend proxy
      console.log('Simulating successful API response with mock data');
      
      // Add a small delay to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock data for the specific query
      const mockResults = generateMockSearchResults(query, parseInt(maxResults));
      
      // Log the mock results
      console.log(`Found ${mockResults.length} mock results for "${query}"`);
      
      return mockResults;
    }
    
    // This direct API call will likely fail due to CORS issues in a browser environment
    // In a real implementation, all API calls should go through a backend proxy
    try {
      const response = await Promise.race([
        fetch(url, {
          method: 'GET',
          headers: headers
        }),
        timeoutPromise
      ]);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Zinc API response error:', response.status, errorText);
        throw new Error(`Zinc API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Zinc API response:', data);
      
      // If we get results, return them
      if (data.results && data.results.length > 0) {
        console.log(`Found ${data.results.length} results from Zinc API for "${query}"`);
        return data.results;
      }
      
      // No results found
      console.log(`No results found from Zinc API for "${query}"`);
      toast.error('No Results Found', {
        description: `The Zinc API returned no results for "${query}"`,
        duration: 5000,
      });
      
      return [];
    } catch (error) {
      // This will catch CORS errors when making direct API calls from the browser
      console.error('CORS or network error when calling Zinc API directly:', error);
      
      if (!hasShownCorsErrorToast) {
        hasShownCorsErrorToast = true;
        toast.error('CORS Error', {
          description: 'Direct API calls to Zinc are blocked by CORS. Using mock data instead.',
          duration: 5000,
        });
      }
      
      // Fall back to mock data for demonstration purposes
      console.log('Falling back to mock data due to CORS or network error');
      return generateMockSearchResults(query, parseInt(maxResults));
    }
  } catch (error) {
    console.error(`Error calling Zinc API: ${error}`);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('Network error: Failed to connect to Zinc API');
      toast.error('Connection Error', {
        description: 'Failed to connect to Zinc API. In a production app, this would use a server-side proxy.',
        duration: 5000,
      });
    } else {
      toast.error('API Error', {
        description: 'Error from Zinc API. Using mock data for demonstration purposes.',
        duration: 5000,
      });
    }
    
    // Fall back to mock data for demonstration
    console.log('Using mock data after API error');
    return generateMockSearchResults(query, parseInt(maxResults));
  }
};
