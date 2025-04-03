
import { ZincProduct } from '../types';

/**
 * Generate product detail images for a zinc product
 */
export function generateProductDetailImages(data: any, mainImage: string): string[] {
  // Start with any existing images
  const existingImages = Array.isArray(data.images) ? data.images : [];
  
  // For Amazon images, just use the original image to avoid showing wrong products
  if (typeof mainImage === 'string' && 
      (mainImage.includes('amazon.com') || mainImage.includes('m.media-amazon.com'))) {
    return [mainImage];
  }
  
  // Generate variations from the main image only if not an Amazon URL
  const variations = generateBasicVariations(mainImage);
  
  // Combine and deduplicate
  const allImages = [...existingImages, ...variations];
  
  // Return unique set
  return [...new Set(allImages)];
}

/**
 * Generate product images for search results
 */
export function generateProductImages(mainImage: string, productTitle: string): string[] {
  if (!mainImage || mainImage === "/placeholder.svg") {
    return ["/placeholder.svg"];
  }
  
  // For Amazon images, just return the original to avoid showing wrong products
  if (mainImage.includes('amazon.com') || mainImage.includes('m.media-amazon.com')) {
    return [mainImage];
  }
  
  // Generate simple variations
  return generateBasicVariations(mainImage);
}

/**
 * Create basic image variations that won't result in wrong products
 */
function generateBasicVariations(baseImage: string): string[] {
  // Return placeholder if no base image
  if (!baseImage) {
    return ["/placeholder.svg"];
  }
  
  // Just use the original image for Amazon to avoid showing wrong products
  if (typeof baseImage === 'string' && 
      (baseImage.includes('amazon.com') || baseImage.includes('m.media-amazon.com'))) {
    return [baseImage];
  }
  
  // For non-Amazon images, add minimal URL parameters
  const timestamp = Date.now();
  return [
    baseImage,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}t=${timestamp}`
  ];
}

/**
 * Get a fallback image based on product category or name - only used if no images at all
 */
export function getFallbackImage(productNameOrCategory: string): string {
  // Generic placeholder that's clearly a placeholder
  return '/placeholder.svg';
}
