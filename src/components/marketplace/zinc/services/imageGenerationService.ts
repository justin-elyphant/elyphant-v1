
import { getExactProductImage } from '../utils/images/productImageUtils';

/**
 * Generate appropriate images array for a product from search results
 */
export const generateProductImages = (item: any, mainImage: string): string[] => {
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
  if (images.length === 0 && mainImage && mainImage !== '/placeholder.svg') {
    // Extract the base URL without any existing parameters
    const baseUrl = mainImage.split('?')[0];
    
    // Generate visually distinct variations with different size parameters
    images = [
      baseUrl, // Original image
      `${baseUrl}?sx=500&sy=500&ex=500&ey=500`, // Square crop
      `${baseUrl}?sx=600&sy=300&ex=600&ey=300` // Wider crop
    ];
    
    // Add another variation based on product type
    const title = item.title.toLowerCase();
    if (title.includes('tv') || title.includes('monitor')) {
      images.push(`${baseUrl}?angle=side`);
    } else if (title.includes('phone') || title.includes('laptop')) {
      images.push(`${baseUrl}?angle=back`);
    } else {
      images.push(`${baseUrl}?angle=alt`);
    }
    
    console.log(`Generated ${images.length} image variations for ${item.title}`);
  } else if (images.length === 0) {
    images = ['/placeholder.svg'];
  }
  
  return images;
};

/**
 * Generate images array for product details
 */
export const generateProductDetailImages = (data: any, mainImage: string): string[] => {
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
      // Add 2-3 related but different images based on the product
      for (let i = 1; i <= 3; i++) {
        // Create unique product modification parameter
        const viewParam = `?view=${i}`;
        
        // Try to get a category-specific image first
        if (i === 1) {
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
      console.warn("Could not use product image utilities:", error);
      // Fallback: add simple variations
      images.push(`${mainImage}?view=2`);
      images.push(`${mainImage}?view=3`);
    }
    
    console.log(`Generated ${images.length} image variations for ${data.title}`);
  }
  
  return images;
};
