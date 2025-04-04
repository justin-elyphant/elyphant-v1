
import { ZincProduct } from '../types';
import { ZINC_API_BASE_URL, getZincHeaders } from '../zincCore';

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
    const url = `${ZINC_API_BASE_URL}/search?query=${encodeURIComponent(query)}&retailer=amazon&limit=100`;
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
    
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((item: any) => {
        // Determine if product is a best seller (top 10% of results)
        const isBestSeller = data.results.indexOf(item) < Math.ceil(data.results.length * 0.1);
        
        // Calculate price correctly - convert cents to dollars if needed
        let price = 0;
        if (typeof item.price === 'number') {
          price = item.price > 1000 ? item.price / 100 : item.price;
        } else if (typeof item.price === 'string') {
          price = parseFloat(item.price) || 0;
        }
        
        // Ensure we have an image array
        const images = item.images && Array.isArray(item.images) ? 
          item.images : 
          (item.image ? [item.image] : ['/placeholder.svg']);
        
        return {
          product_id: item.product_id || item.asin,
          title: item.title,
          price: price,
          image: item.image || '/placeholder.svg',
          images: images,
          description: item.description || item.product_description || '',
          brand: item.brand || 'Unknown',
          category: item.category || 'Electronics',
          retailer: "Amazon via Zinc",
          rating: item.rating || item.stars || 0,
          review_count: item.review_count || item.num_reviews || 0,
          features: item.features || item.bullet_points || [],
          specifications: item.specifications || {},
          isBestSeller: isBestSeller
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error searching products via Zinc:', error);
    return [];
  }
};
