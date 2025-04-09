
/**
 * Service for making Zinc API calls
 */
import { ZincProduct } from "../../types";
import { ZINC_API_BASE_URL, getZincHeaders } from "../../zincCore";

/**
 * Call the Zinc API to search for products
 */
export const searchZincApi = async (
  query: string,
  maxResults: string
): Promise<ZincProduct[] | null> => {
  try {
    const url = `${ZINC_API_BASE_URL}/search?query=${encodeURIComponent(query)}&max_results=${maxResults}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getZincHeaders()
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
    return null;
  } catch (error) {
    console.error(`Error calling Zinc API: ${error}`);
    throw error;
  }
};
