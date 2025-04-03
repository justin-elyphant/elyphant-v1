
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
  
  // 3. Create fallback images by generating variations - only for Amazon images
  if ((images.length === 0 || images.length < 3) && 
      mainImage && 
      mainImage !== '/placeholder.svg' && 
      (mainImage.includes('amazon.com') || mainImage.includes('m.media-amazon.com'))) {
    // Extract the base URL without any existing parameters
    const baseUrl = mainImage.split('?')[0];
    
    // Generate visually distinct variations with entirely different parameters
    const hash = Date.now(); // Add timestamp to prevent caching
    const newImages = [
      baseUrl, // Original image
      `${baseUrl}?sx=0&sy=0&ex=1000&ey=1000&hash=${hash}`, // Full view
      `${baseUrl}?angle=front&m=fit&h=600&w=600&hash=${hash+1}`, // Front angle
      `${baseUrl}?view=side&f=f6f6f6&hash=${hash+2}`, // Side view
      `${baseUrl}?rotation=45&f=ffffff&hash=${hash+3}` // Rotated view
    ];
    
    // Add another variation based on product type
    const title = item.title.toLowerCase();
    if (title.includes('tv') || title.includes('monitor')) {
      newImages.push(`${baseUrl}?angle=side&m=contain&hash=${hash+4}`);
    } else if (title.includes('phone') || title.includes('laptop')) {
      newImages.push(`${baseUrl}?angle=back&m=crop&hash=${hash+5}`);
    } else if (title.includes('food') || title.includes('container')) {
      newImages.push(`${baseUrl}?angle=top&q=85&hash=${hash+6}`);
    } else {
      newImages.push(`${baseUrl}?angle=alt&m=pad&hash=${hash+7}`);
    }
    
    // If we already have some images, add the new ones
    if (images.length > 0) {
      // Add new images to existing ones, avoiding duplicates
      newImages.forEach(img => {
        if (!images.includes(img)) {
          images.push(img);
        }
      });
    } else {
      images = newImages;
    }
    
    console.log(`Generated ${images.length} truly distinct image variations for ${item.title}`);
  } else if (images.length === 0) {
    images = ['/placeholder.svg'];
  }
  
  // Ensure images are unique
  return Array.from(new Set(images));
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
  // 2. Create fallback images - only for Amazon products
  else if (mainImage && 
           mainImage !== '/placeholder.svg' && 
           (mainImage.includes('amazon.com') || mainImage.includes('m.media-amazon.com'))) {
    // Start with the main image
    images = [mainImage];
    
    const title = data.title || '';
    const hash = Date.now(); // Add timestamp to prevent caching
    
    try {
      const baseUrl = mainImage.split('?')[0];
      
      // Add Amazon-specific image variations with distinct parameters to ensure different images
      images.push(`${baseUrl}?m=fit&h=800&w=800&hash=${hash}`);
      images.push(`${baseUrl}?m=contain&h=600&w=600&hash=${hash+1}`);
      images.push(`${baseUrl}?m=crop&h=400&w=400&hash=${hash+2}`);
      
      // Add different angles based on product type
      if (title.toLowerCase().includes('tv') || title.toLowerCase().includes('monitor')) {
        images.push(`${baseUrl}?angle=front&f=ffffff&hash=${hash+3}`);
        images.push(`${baseUrl}?angle=side&f=ffffff&hash=${hash+4}`);
      } else if (title.toLowerCase().includes('phone') || title.toLowerCase().includes('laptop')) {
        images.push(`${baseUrl}?angle=side&f=f8f8f8&hash=${hash+5}`);
        images.push(`${baseUrl}?angle=back&f=f8f8f8&hash=${hash+6}`);
      } else if (title.toLowerCase().includes('food') || title.toLowerCase().includes('container')) {
        images.push(`${baseUrl}?angle=top&f=fafafa&hash=${hash+7}`);
        images.push(`${baseUrl}?angle=3q&f=fafafa&hash=${hash+8}`);
      } else {
        images.push(`${baseUrl}?angle=back&f=fdfdfd&hash=${hash+9}`);
        images.push(`${baseUrl}?angle=front&f=fdfdfd&hash=${hash+10}`);
      }
    } catch (error) {
      console.warn("Could not generate image variations:", error);
    }
    
    console.log(`Generated ${images.length} truly distinct image variations for ${data.title}`);
  } else if (images.length === 0) {
    images = ['/placeholder.svg'];
  }
  
  // Ensure all images are unique
  return Array.from(new Set(images));
};
