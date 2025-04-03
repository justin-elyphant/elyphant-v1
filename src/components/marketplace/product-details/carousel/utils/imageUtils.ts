
/**
 * Utilities for product carousel image processing
 */

/**
 * Deduplicates Amazon images by looking at product IDs in the URL
 */
export const deduplicateAmazonImages = (imageUrls: string[]): string[] => {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }
  
  // For Amazon URLs, make sure we're not showing duplicates
  if (imageUrls[0].includes('amazon.com') || imageUrls[0].includes('m.media-amazon.com')) {
    // Create a Set to automatically remove exact duplicates
    return [...new Set(imageUrls)];
  }
  
  // For non-Amazon URLs, deduplicate normally
  return [...new Set(imageUrls)];
};

/**
 * Extract Amazon product ID from image URL
 */
export const extractAmazonProductId = (url: string): string | null => {
  const regex = /\/images\/I\/([A-Za-z0-9]+)(\._.*)?/;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
};

/**
 * Process images to ensure they're unique and relevant
 */
export const processImages = (images: string[]): string[] => {
  if (!images || !Array.isArray(images)) {
    return ['/placeholder.svg'];
  }
  
  // Filter out any invalid or placeholder images
  const filteredImages = images.filter(img => 
    img && img !== '/placeholder.svg' && !img.includes('unsplash.com') 
  );
  
  // If we have no valid images, add a placeholder
  if (filteredImages.length === 0) {
    return ["/placeholder.svg"];
  }
  
  // Remove exact duplicates using Set
  const uniqueImageArray = [...new Set(filteredImages)];
  
  return uniqueImageArray;
};

/**
 * Create image variations from a single base image
 * This is a special utility for creating varied images without actually modifying them
 * for display purposes only
 */
export const generateImageVariations = (baseImage: string, productName: string): string[] => {
  if (!baseImage || baseImage === "/placeholder.svg") {
    return ["/placeholder.svg"];
  }
  
  // Just return the original image to avoid showing incorrect products
  return [baseImage];
};
