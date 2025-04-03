
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
    
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((item: any) => {
        // Create a base image URL
        const mainImage = item.image_url || item.image || '/placeholder.svg';
        
        // Create an images array (ensuring we always have at least the main image)
        let images = [];
        if (item.images && Array.isArray(item.images) && item.images.length > 0) {
          images = item.images;
        } else {
          // If no images array, create one with variations of the main image
          // This simulates multiple product views
          images = [mainImage];
          // Add variations of the image URL to simulate different views
          for (let i = 1; i < 3; i++) {
            const viewParam = mainImage.includes('?') ? 
              `&view=${i}` : 
              `?view=${i}`;
            images.push(`${mainImage}${viewParam}`);
          }
        }
        
        return {
          product_id: item.product_id || item.asin,
          title: item.title,
          price: typeof item.price === 'number' ? item.price / 100 : parseFloat(item.price) || 0,
          image: mainImage,
          images: images,
          description: item.description || item.product_description || '',
          brand: item.brand || 'Unknown',
          category: item.category || 'Electronics',
          retailer: "Amazon via Zinc",
          rating: item.stars || item.rating || 0,
          review_count: item.num_reviews || item.review_count || 0,
          features: item.features || item.bullet_points || [],
          specifications: item.specifications || {}
        };
      });
    }
    
    return [];
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
    
    console.log('Fetching product details from Zinc API:', url);
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zinc API error:', response.status, errorText);
      throw new Error(`Zinc API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Zinc product details response:', data);
    
    // Create a base image URL
    const mainImage = (data.images && data.images[0]) || data.image || '/placeholder.svg';
    
    // Create an images array
    let images = [];
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      images = data.images;
    } else {
      // If no images array, create one with variations of the main image
      images = [mainImage];
      for (let i = 1; i < 3; i++) {
        const viewParam = mainImage.includes('?') ? 
          `&view=${i}` : 
          `?view=${i}`;
        images.push(`${mainImage}${viewParam}`);
      }
    }
    
    return {
      product_id: data.product_id || data.asin,
      title: data.title,
      price: typeof data.price === 'number' ? data.price / 100 : parseFloat(data.price) || 0,
      image: mainImage,
      images: images,
      description: data.description || '',
      brand: data.brand || 'Unknown',
      category: data.category || 'Electronics',
      retailer: 'Amazon via Zinc',
      rating: data.stars || data.rating || 0,
      review_count: data.num_reviews || data.review_count || 0
    };
  } catch (error) {
    console.error('Error fetching product from Zinc:', error);
    return null;
  }
};
