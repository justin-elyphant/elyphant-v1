
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
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zinc API error:', response.status, errorText);
      throw new Error(`Zinc API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Zinc product details response:', data);
    
    // Create a base image URL - ensure it's not undefined
    const mainImage = (data.images && data.images[0]) || data.image || '/placeholder.svg';
    
    // Generate images for the product detail
    const images = generateProductDetailImages(data, mainImage);
    
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
      review_count: data.num_reviews || data.review_count || 0,
      features: data.features || data.bullet_points || [],
      specifications: data.specifications || {}
    };
  } catch (error) {
    console.error('Error fetching product from Zinc:', error);
    return null;
  }
};
