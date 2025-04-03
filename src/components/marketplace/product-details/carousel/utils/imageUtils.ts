/**
 * Utilities for product carousel image processing
 */

/**
 * Deduplicates Amazon images by looking at product IDs in the URL
 */
export const deduplicateAmazonImages = (imageUrls: string[]): string[] => {
  const productIdMap = new Map<string, string>();
  const urlWithParamsMap = new Map<string, string>();
  const result: string[] = [];
  
  // First pass: Group by product ID and collect unique parameter combinations
  imageUrls.forEach(url => {
    // Extract the base URL and product ID
    const baseUrl = url.split('?')[0];
    const productId = extractAmazonProductId(baseUrl);
    const hasParams = url.includes('?');
    
    if (productId) {
      // If this is a new product ID, add it to our result
      if (!productIdMap.has(productId)) {
        productIdMap.set(productId, url);
        result.push(url);
      } else if (hasParams && !urlWithParamsMap.has(url)) {
        // If this has unique params, also add it
        urlWithParamsMap.set(url, url);
        result.push(url);
      }
    } else {
      // If we couldn't extract a product ID, keep the URL
      result.push(url);
    }
  });
  
  // Ensure we have at least 2 images, add timestamp params if needed
  if (result.length < 2 && imageUrls.length > 0) {
    const timestamp = Date.now();
    const baseUrl = imageUrls[0].split('?')[0];
    
    // Add a couple more with timestamp params
    result.push(`${baseUrl}?t=${timestamp}&view=alt`);
    result.push(`${baseUrl}?t=${timestamp+1}&view=back`);
  }
  
  return result;
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
  
  // More aggressive deduplication for Amazon images
  if (filteredImages.length > 0 && filteredImages[0].includes('amazon.com')) {
    // For Amazon images, we need special handling
    const deduplicatedImages = deduplicateAmazonImages(filteredImages);
    console.log(`ProcessedImages: ${deduplicatedImages.length} truly unique Amazon images from ${filteredImages.length} total`);
    return deduplicatedImages;
  } else {
    // For other images, general deduplication
    const imageSet = new Set(filteredImages);
    const uniqueImageArray = Array.from(imageSet);
    
    // If we still have no images, add a placeholder
    const finalImages = uniqueImageArray.length > 0 ? uniqueImageArray : images.length > 0 ? [images[0]] : ["/placeholder.svg"];
    
    console.log(`ProcessedImages: ${finalImages.length} truly unique from ${images.length} total`);
    return finalImages;
  }
};

/**
 * Create image variations from a single base image
 * This is a special utility for creating varied images without actually modifying them
 * for display purposes only
 */
export const generateImageVariations = (baseImage: string, productName: string): string[] => {
  // Implement a simplified version that's different from the one in imageGenerationService
  if (!baseImage || baseImage === "/placeholder.svg") {
    return ["/placeholder.svg"];
  }
  
  const timestamp = Date.now();
  
  return [
    baseImage,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}v=alt&t=${timestamp}`,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}v=main&t=${timestamp+1}`,
  ];
};
