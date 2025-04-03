
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
    
    // Try to get a category-specific image from Amazon
    const category = data.category || 'Electronics';
    const title = data.title || '';
    
    try {
      // Only use Amazon-specific images
      if (mainImage.includes('amazon.com') || mainImage.includes('m.media-amazon.com')) {
        const baseUrl = mainImage.split('?')[0];
        
        // Add Amazon-specific image variations
        images.push(`${baseUrl}?sx=300&sy=300&ex=600&ey=600`);
        images.push(`${baseUrl}?sx=0&sy=0&ex=800&ey=400`);
        
        // Add different angles based on product type
        if (title.toLowerCase().includes('tv') || title.toLowerCase().includes('monitor')) {
          images.push(`${baseUrl}?angle=front&f=ffffff`);
        } else if (title.toLowerCase().includes('phone') || title.toLowerCase().includes('laptop')) {
          images.push(`${baseUrl}?angle=side&f=f8f8f8`);
        } else if (title.toLowerCase().includes('food') || title.toLowerCase().includes('container')) {
          images.push(`${baseUrl}?angle=top&f=fafafa`);
        } else {
          images.push(`${baseUrl}?angle=back&f=fdfdfd`);
        }
      }
      // For non-Amazon images, create simple variations
      else if (mainImage !== '/placeholder.svg') {
        images.push(`${mainImage}${mainImage.includes('?') ? '&' : '?'}view=side`);
        images.push(`${mainImage}${mainImage.includes('?') ? '&' : '?'}view=detail`);
      }
    } catch (error) {
      console.warn("Could not generate image variations:", error);
    }
    
    console.log(`Generated ${images.length} image variations for ${data.title}`);
  }
  
  return images;
};
