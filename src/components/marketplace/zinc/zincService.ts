
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
        // Create a base image URL - ensure it's not undefined
        const mainImage = item.image_url || item.image || '/placeholder.svg';
        
        // Enhanced images array creation
        let images: string[] = [];
        
        // 1. Try to use the API-provided images array
        if (item.images && Array.isArray(item.images) && item.images.length > 0) {
          images = item.images.filter((img: string) => img && typeof img === 'string');
          console.log(`Using ${images.length} API-provided images for ${item.title}`);
        } 
        // 2. If no valid images array but we have multiple image_urls
        else if (item.image_urls && Array.isArray(item.image_urls) && item.image_urls.length > 0) {
          images = item.image_urls.filter((img: string) => img && typeof img === 'string');
          console.log(`Using ${images.length} image_urls for ${item.title}`);
        }
        // 3. Create fallback images by generating variations
        
        // Always include the main image if we have no other images
        if (images.length === 0 && mainImage) {
          // Start with the main image
          images = [mainImage];
          
          // Use the getExactProductImage utility to get category-specific images
          const category = item.category || 'Electronics';
          const title = item.title || '';
          
          try {
            // Import dynamically to avoid circular dependencies
            const { getExactProductImage } = require('./utils/images/productImageUtils');
            
            // Add 2-3 related but different images based on the product
            for (let i = 1; i <= 3; i++) {
              // Create unique product modification parameter
              const viewParam = `?view=${i}`;
              
              // Try to get a category-specific image first
              if (i === 1 && typeof getExactProductImage === 'function') {
                const specificImage = getExactProductImage(title, category);
                if (specificImage && specificImage !== mainImage) {
                  images.push(specificImage);
                  continue;
                }
              }
              
              // Add a variation of the main image
              if (!mainImage.includes(viewParam)) {
                images.push(`${mainImage}${viewParam}`);
              }
            }
          } catch (error) {
            console.warn("Could not import product image utilities:", error);
            // Fallback: add simple variations
            images.push(`${mainImage}?view=2`);
            images.push(`${mainImage}?view=3`);
          }
          
          console.log(`Generated ${images.length} image variations for ${item.title}`);
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
    
    // Create an enhanced images array
    let images: string[] = [];
    
    // 1. Try to use the API-provided images array
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      images = data.images.filter((img: string) => img && typeof img === 'string');
      console.log(`Using ${images.length} API-provided images for ${data.title}`);
    }
    // 2. Create fallback images
    else {
      // Start with the main image
      images = [mainImage];
      
      // Use the getExactProductImage utility to get category-specific images
      const category = data.category || 'Electronics';
      const title = data.title || '';
      
      try {
        // Import dynamically to avoid circular dependencies
        const { getExactProductImage } = require('./utils/images/productImageUtils');
        
        // Add 2-3 related but different images based on the product
        for (let i = 1; i <= 3; i++) {
          // Create unique product modification parameter
          const viewParam = `?view=${i}`;
          
          // Try to get a category-specific image first
          if (i === 1 && typeof getExactProductImage === 'function') {
            const specificImage = getExactProductImage(title, category);
            if (specificImage && specificImage !== mainImage) {
              images.push(specificImage);
              continue;
            }
          }
          
          // Add a variation of the main image
          if (!mainImage.includes(viewParam)) {
            images.push(`${mainImage}${viewParam}`);
          }
        }
      } catch (error) {
        console.warn("Could not import product image utilities:", error);
        // Fallback: add simple variations
        images.push(`${mainImage}?view=2`);
        images.push(`${mainImage}?view=3`);
      }
      
      console.log(`Generated ${images.length} image variations for ${data.title}`);
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
      review_count: data.num_reviews || data.review_count || 0,
      features: data.features || data.bullet_points || [],
      specifications: data.specifications || {}
    };
  } catch (error) {
    console.error('Error fetching product from Zinc:', error);
    return null;
  }
};
