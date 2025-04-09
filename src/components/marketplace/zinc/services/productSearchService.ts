
import { ZincProduct } from '../types';
import { ZINC_API_BASE_URL, getZincHeaders, isTestMode } from '../zincCore';
import { findMatchingProducts } from '../utils/searchUtils';
import { createMockResults } from '../utils/mockResultsGenerator';

/**
 * Search for products on multiple marketplaces via the Zinc API
 * @param query The search query
 * @param retailer The retailer to search (default: amazon)
 * @returns An array of products matching the search
 */
export const searchProducts = async (query: string, retailer = 'amazon'): Promise<ZincProduct[]> => {
  try {
    console.log(`Searching products for query: ${query}, minimum count: 100`);
    
    // Handle test/mock mode
    if (isTestMode()) {
      console.log("Using realistic mock search results for development");
      
      // Add randomness to results for development with seed from query
      // This makes search results deterministic for the same query
      const timestamp = Date.now();
      const randomSeed = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const searchResults = findMatchingProducts(query);
      
      // Add some randomness to search results for more realistic results
      const randomizedResults = searchResults.map(product => {
        const randomFactor = (Math.sin(product.title.length * randomSeed) + 1) / 2;
        const randomRating = 3.5 + randomFactor * 1.5;
        const randomReviews = Math.floor(50 + randomFactor * 950);
        
        return {
          ...product,
          rating: parseFloat(randomRating.toFixed(1)),
          review_count: randomReviews,
          brand: product.brand || (query.includes('47') ? '47 Brand' : undefined)
        };
      });
      
      return randomizedResults;
    }
    
    // In production, make a real API call to Zinc
    const url = `${ZINC_API_BASE_URL}/search?query=${encodeURIComponent(query)}&retailer=${retailer}&max_results=100`;
    const headers = getZincHeaders();
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zinc API error:', response.status, errorText);
      
      // Return mock results as fallback on error
      console.log('Using mock results as fallback due to API error');
      return createMockResults(query, undefined, 100, 4, 5, undefined, true);
    }
    
    const data = await response.json();
    
    // If we get a valid response with results, return it
    if (data && data.results && Array.isArray(data.results)) {
      // Process and return search results
      return data.results.map((item: any) => ({
        product_id: item.product_id || item.asin || `result-${Math.random()}`,
        title: item.title,
        price: typeof item.price === 'number' ? item.price / 100 : parseFloat(item.price) || 0,
        image: item.image_url || item.image || '/placeholder.svg',
        images: item.images || [item.image_url || item.image || '/placeholder.svg'],
        description: item.description || '',
        rating: parseFloat(item.rating) || 0,
        review_count: parseInt(item.review_count, 10) || 0,
        retailer: 'Amazon via Zinc',
        category: item.category || 'Electronics',
        brand: item.brand || '',
        features: item.features || []
      }));
    } else {
      console.log('Empty or invalid response from Zinc API, using mock results');
      return createMockResults(query, undefined, 100, 4, 5, undefined, true);
    }
    
  } catch (error) {
    console.error('Error searching products:', error);
    
    // Return mock results as fallback on error
    console.log('Using mock results as fallback due to error');
    return createMockResults(query, undefined, 100, 4, 5, undefined, true);
  }
};
