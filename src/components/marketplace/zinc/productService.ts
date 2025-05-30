
import { ZincProduct } from './types';
import { ZINC_API_BASE_URL, getZincHeaders } from './zincCore';
import { findMatchingProducts } from './utils/searchUtils';

/**
 * Fetch product details from Amazon via Zinc API
 */
export const fetchProductDetails = async (productId: string): Promise<ZincProduct | null> => {
  try {
    const url = `${ZINC_API_BASE_URL}/products/${productId}?retailer=amazon`;
    const headers = getZincHeaders();
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error('Zinc API error:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    return {
      product_id: data.product_id,
      title: data.title,
      price: data.price,
      image: data.images[0] || '/placeholder.svg',
      description: data.description,
      brand: data.brand,
      category: data.category,
      retailer: 'Amazon via Zinc'
    };
  } catch (error) {
    console.error('Error fetching product from Zinc:', error);
    return null;
  }
};

/**
 * Search for products on Amazon via Zinc API
 */
export const searchProducts = async (query: string): Promise<ZincProduct[]> => {
  console.log(`Searching products for query: ${query}`);
  
  if (!query || query.trim().length <= 2) {
    console.log('Search query too short, returning empty results');
    return [];
  }
  
  try {
    // In a real implementation, we would call the Zinc API
    // For now, we'll return mock data based on the query to simulate search results
    console.log('Using mock search results for demo purposes');
    
    // Generate mock results based on search query
    const mockResults = findMatchingProducts(query);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockResults;
  } catch (error) {
    console.error('Error searching products via Zinc:', error);
    return [];
  }
};
