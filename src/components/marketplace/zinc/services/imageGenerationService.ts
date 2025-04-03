
import { ZincProduct } from '../types';

/**
 * Generate product detail images for a zinc product
 */
export function generateProductDetailImages(data: any, mainImage: string): string[] {
  // Start with any existing images from the product data
  const existingImages: string[] = [];
  
  // Extract images from the product data
  if (data) {
    // If data.images is an array and has content, use those images
    if (Array.isArray(data.images) && data.images.length > 0) {
      data.images.forEach((img: string) => {
        if (img && typeof img === 'string' && !existingImages.includes(img)) {
          existingImages.push(img);
        }
      });
    }
    
    // If data has additional_images array, add those too
    if (Array.isArray(data.additional_images) && data.additional_images.length > 0) {
      data.additional_images.forEach((img: string) => {
        if (img && typeof img === 'string' && !existingImages.includes(img)) {
          existingImages.push(img);
        }
      });
    }
    
    // If there's a main product image and it's not in our array yet, add it
    if (data.image && typeof data.image === 'string' && !existingImages.includes(data.image)) {
      existingImages.push(data.image);
    }
  }
  
  // If we have the main image and it's not already included, add it
  if (mainImage && typeof mainImage === 'string' && !existingImages.includes(mainImage)) {
    existingImages.push(mainImage);
  }
  
  // If we still have no images, use the main image or placeholder
  if (existingImages.length === 0) {
    return mainImage ? [mainImage] : ['/placeholder.svg'];
  }
  
  // Return our collection of unique images
  return existingImages;
}

/**
 * Generate product images for search results
 */
export function generateProductImages(mainImage: string, productTitle: string): string[] {
  if (!mainImage || mainImage === "/placeholder.svg") {
    return ["/placeholder.svg"];
  }
  
  // For product listings, just return the main image
  return [mainImage];
}

/**
 * Get a fallback image based on product category or name - only used if no images at all
 */
export function getFallbackImage(productNameOrCategory: string): string {
  // Generic placeholder that's clearly a placeholder
  return '/placeholder.svg';
}
