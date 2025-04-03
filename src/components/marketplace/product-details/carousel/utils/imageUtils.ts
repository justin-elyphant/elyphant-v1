
/**
 * Utilities for product carousel image processing
 */

/**
 * Deduplicates Amazon images by looking at product IDs in the URL
 */
export const deduplicateAmazonImages = (imageUrls: string[]): string[] => {
  // Since we're being more conservative, just return the first image if it's an Amazon URL
  if (imageUrls.length > 0 && 
      (imageUrls[0].includes('amazon.com') || imageUrls[0].includes('m.media-amazon.com'))) {
    return [imageUrls[0]];
  }
  
  // For non-Amazon URLs, deduplicate normally
  const uniqueUrls = [...new Set(imageUrls)];
  return uniqueUrls;
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
  // Filter out any unsplash fallback images to avoid showing unrelated content
  const filteredImages = images.filter(img => 
    !img.includes('unsplash.com') && img !== '/placeholder.svg'
  );
  
  // For Amazon images, just use the first image to avoid mixing products
  if (filteredImages.length > 0 && 
      (filteredImages[0].includes('amazon.com') || filteredImages[0].includes('m.media-amazon.com'))) {
    return [filteredImages[0]];
  }
  
  // For other images, general deduplication
  const imageSet = new Set(filteredImages);
  const uniqueImageArray = Array.from(imageSet);
  
  // If we still have no images, add a placeholder
  return uniqueImageArray.length > 0 ? uniqueImageArray : ["/placeholder.svg"];
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
  
  // For Amazon images, be very conservative - just return the original image
  if (baseImage.includes('amazon.com') || baseImage.includes('m.media-amazon.com')) {
    return [baseImage];
  }
  
  // For non-Amazon images, create parameter variations
  // But be more conservative
  const timestamp = Date.now();
  return [
    baseImage,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}t=${timestamp}`,
  ];
};
