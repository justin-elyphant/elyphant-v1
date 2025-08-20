
import { ZincProduct } from '../types';
import { ZINC_API_BASE_URL, getZincHeaders } from '../zincCore';
import { getExactProductImage } from '../utils/images/productImageUtils';
import { generateProductDetailImages } from './imageGenerationService';

/**
 * Fetch product details from Amazon via Zinc API
 */
export const fetchProductDetails = async (productId: string): Promise<ZincProduct | null> => {
  try {
    const url = `${ZINC_API_BASE_URL}/products/${productId}?retailer=amazon`;
    const headers = getZincHeaders();
    
    console.log('Fetching product details from Zinc API:', url);
    console.log('Using Basic Auth headers:', headers['Authorization'].substring(0, 20) + '...');
    
    // Print verbose details for debugging
    const verboseHeaders = { ...headers };
    delete verboseHeaders['Authorization']; // Don't log full auth header 
    console.log('Full request headers (excluding auth):', verboseHeaders);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, { 
        method: 'GET',
        headers,
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Zinc API error:', response.status, errorText);
        throw new Error(`Zinc API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Zinc API success! Product details response:', data);
      
      // Create a base image URL - ensure it's not undefined
      const mainImage = (data.images && data.images[0]) || data.image || '/placeholder.svg';
      
      // Generate images for the product detail by collecting all available images
      const images = generateProductDetailImages(data, mainImage);
      
      // Log image collection results
      console.log(`Collected ${images.length} images for product:`, {
        productId,
        title: data.title,
        imageCount: images.length
      });
      
      return {
        product_id: data.product_id || data.asin || productId, // Use the ID that was passed if nothing else works
        title: data.title,
        price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
        image: mainImage,
        images: images,
        description: data.description || '',
        brand: data.brand || 'Unknown',
        category: data.category || 'Electronics',
        retailer: 'Amazon via Zinc',
        rating: data.stars || data.rating || 0,
        review_count: data.num_reviews || data.review_count || 0,
        features: data.features || data.bullet_points || [],
        specifications: data.specifications || {}
      };
    } catch (fetchError) {
      // Handle network errors (including CORS)
      if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
        console.error('CORS or network error when calling Zinc API directly:', fetchError);
        console.log('To test live API in development, you can:');
        console.log('1. Use a CORS browser extension like "Allow CORS" for Chrome (for testing only!)');
        console.log('2. Create a server-side proxy (recommended for production)');
        
        throw new Error('Browser security (CORS) is preventing direct API calls. A server-side proxy is required or try using a CORS browser extension for testing.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching product from Zinc:', error);
    return null;
  }
};
