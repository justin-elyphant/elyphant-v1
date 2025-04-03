
import { ZincProduct } from './types';
import { ZINC_API_BASE_URL, getZincHeaders } from './zincCore';

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
    // Call the actual Zinc API
    const url = `${ZINC_API_BASE_URL}/search?query=${encodeURIComponent(query)}&retailer=amazon`;
    const headers = getZincHeaders();
    
    console.log('Calling Zinc API:', url);
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zinc API error:', response.status, errorText);
      throw new Error(`Zinc API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Zinc API response:', data);
    
    // Transform the Zinc API response to our ZincProduct format
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((item: any) => ({
        product_id: item.product_id || item.asin,
        title: item.title,
        price: typeof item.price === 'number' ? item.price / 100 : parseFloat(item.price) || 0,
        image: item.image_url || item.image || '/placeholder.svg',
        description: item.description || '',
        brand: item.brand || 'Unknown',
        category: item.category || 'Electronics',
        retailer: "Amazon via Zinc",
        rating: item.stars || 0,
        review_count: item.num_reviews || 0
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching products via Zinc:', error);
    // If the API fails, still return an empty array rather than crashing
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
    
    console.log('Fetching product details from Zinc API:', url);
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zinc API error:', response.status, errorText);
      throw new Error(`Zinc API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Zinc product details response:', data);
    
    return {
      product_id: data.product_id || data.asin,
      title: data.title,
      price: typeof data.price === 'number' ? data.price / 100 : parseFloat(data.price) || 0,
      image: (data.images && data.images[0]) || data.image || '/placeholder.svg',
      description: data.description || '',
      brand: data.brand || 'Unknown',
      category: data.category || 'Electronics',
      retailer: 'Amazon via Zinc',
      rating: data.stars || 0,
      review_count: data.num_reviews || 0
    };
  } catch (error) {
    console.error('Error fetching product from Zinc:', error);
    return null;
  }
};

