
import { ZincProduct } from './types';
import { findMatchingProducts } from './utils/searchUtils';
import { ZINC_API_BASE_URL, getZincHeaders } from './zincCore';

/**
 * Search for products on Amazon via Zinc API
 * In a real implementation, this would call the actual Zinc API
 */
export const searchProducts = async (query: string): Promise<ZincProduct[]> => {
  console.log(`Searching products for query: ${query}`);
  
  if (!query || query.trim().length <= 2) {
    console.log('Search query too short, returning empty results');
    return [];
  }
  
  try {
    // Normalize the query to handle common misspellings
    const normalizedQuery = query.trim().toLowerCase();
    
    // Special handling for common misspellings of MacBook
    const searchQuery = normalizedQuery.includes('mackbook') 
      ? normalizedQuery.replace('mackbook', 'macbook') 
      : normalizedQuery;
    
    console.log('Using mock search results for demo purposes');
    
    // Generate mock results based on search query using accurate pricing and Amazon images
    const mockResults = findMatchingProducts(searchQuery);
    
    // Ensure retailer is set to "Amazon via Zinc" for authenticity
    mockResults.forEach(product => {
      product.retailer = "Amazon via Zinc";
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockResults;
  } catch (error) {
    console.error('Error searching products via Zinc:', error);
    return [];
  }
};

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
