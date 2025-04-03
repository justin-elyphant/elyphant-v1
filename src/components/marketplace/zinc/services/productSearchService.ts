
import { ZincProduct } from '../types';
import { ZINC_API_BASE_URL, getZincHeaders } from '../zincCore';
import { getExactProductImage } from '../utils/images/productImageUtils';
import { generateProductImages } from './imageGenerationService';

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
        // Create a base image URL - ensure it's not undefined
        const mainImage = item.image_url || item.image || '/placeholder.svg';
        
        // Generate appropriate images for the product
        const images = generateProductImages(mainImage, item.title || '');
        
        // Add a category-specific image if we have few images
        try {
          if (images.length < 2) {
            const category = item.category || 'Electronics';
            const specificImage = getExactProductImage(item.title || '', category);
            if (specificImage && !images.includes(specificImage)) {
              images.push(specificImage);
            }
          }
        } catch (error) {
          console.warn("Could not use product image utilities:", error);
        }
        
        // Log what we're returning
        if (item.title.includes(query.substring(0, 5))) {
          console.log(`Product "${item.title}" images:`, images);
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
