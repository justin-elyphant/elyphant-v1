
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
      
      // Fall back to mock results when no token is available
      return generateMockSearchResults(query, parseInt(maxResults));
    }
    
    console.log(`Making real API call to Zinc for query: "${query}", max results: ${maxResults}`);
    console.log('Using API token:', getZincHeaders()['Authorization'].substring(0, 10) + '...');
    
    // In a real implementation, you would have a server endpoint that proxies requests to Zinc
    // Direct browser-to-API calls will be blocked by CORS
    const directUrl = `${ZINC_API_BASE_URL}/search?query=${encodeURIComponent(query)}&max_results=${maxResults}`;
    
    // Set up a proxy URL - in a real app, this would point to your server endpoint 
    // that handles the API request and adds proper CORS headers
    const proxyUrl = `/api/zinc/search?query=${encodeURIComponent(query)}&max_results=${maxResults}`;
    
    // For demo purposes, we'll try a direct call, knowing it might fail due to CORS
    const url = directUrl;
    const headers = getZincHeaders();
    
    // Log detailed debug info about our request
    console.log('API request URL:', url);
    console.log('API request headers:', {
      contentType: headers['Content-Type'],
      authHeaderStart: headers['Authorization'].substring(0, 15) + '...',
      hasToken: headers['Authorization'].length > 8
    });
    
    // Try the real API call with a timeout
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out after 10 seconds')), 10000);
    });
    
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Race between the fetch and the timeout
      const response = await Promise.race([
        fetch(url, {
          method: 'GET',
          headers: headers,
          mode: 'cors', // This is important for CORS requests
          signal
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
      
      // Fall back to mock data
      console.log('Falling back to mock data due to no API results');
      return generateMockSearchResults(query, parseInt(maxResults));
    } catch (error) {
      // This will catch CORS errors when making direct API calls from the browser
      console.error('CORS or network error when calling Zinc API directly:', error);
      
      if (!hasShownCorsErrorToast) {
        hasShownCorsErrorToast = true;
        toast.error('API Connection Error', {
          description: 'Browser security (CORS) prevents direct API calls. A server-side proxy is required.',
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
        description: 'Failed to connect to Zinc API. Please check your internet connection.',
        duration: 5000,
      });
    } else {
      toast.error('API Error', {
        description: 'Error from Zinc API. Using mock data as fallback.',
        duration: 5000,
      });
    }
    
    // Fall back to mock data for demonstration
    console.log('Using mock data after API error');
    return generateMockSearchResults(query, parseInt(maxResults));
  }
};
