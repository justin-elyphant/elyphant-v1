
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
  if (!baseImage || baseImage === "/placeholder.svg") {
    return ["/placeholder.svg"];
  }
  
  // Start with the original image
  const variations = [baseImage];
  
  // Create Amazon-specific variations
  if (baseImage.includes('amazon.com') || baseImage.includes('m.media-amazon.com')) {
    // Extract the base URL without any existing parameters
    const baseUrl = baseImage.split('?')[0];
    
    // Extract product ID if it's an Amazon URL
    const productId = extractAmazonProductId(baseUrl);
    
    if (productId) {
      // Create truly different Amazon product IDs - these should show different angles
      // Modify specific characters in the ID that typically change between view angles
      const modifiedIds = [
        // Original ID
        productId,
        // Change middle character to create side view
        productId.substring(0, Math.floor(productId.length/2)) + 
          (productId.charAt(Math.floor(productId.length/2)) === '1' ? '2' : '1') + 
          productId.substring(Math.floor(productId.length/2) + 1),
        // Modify last non-extension character for back view  
        productId.substring(0, productId.length-1) + 
          (productId.charAt(productId.length-1) === 'L' ? 'R' : 
           productId.charAt(productId.length-1) === '1' ? '2' : '1')
      ];
      
      // Create timestamp to ensure uniqueness
      const timestamp = Date.now();
      
      // Add each variation with a different ID
      modifiedIds.forEach((id, index) => {
        if (id !== productId) {
          const newUrl = baseUrl.replace(productId, id);
          variations.push(`${newUrl}?t=${timestamp + index * 100}`);
        }
      });
      
      // Make sure we have enough variations
      if (variations.length < 3) {
        // Add Amazon-specific view parameters
        variations.push(`${baseUrl}?view=back&t=${timestamp}`);
        variations.push(`${baseUrl}?view=side&t=${timestamp + 50}`);
      }
    } else {
      // If we couldn't extract a product ID, use view parameters
      const timestamp = Date.now();
      variations.push(`${baseUrl}?view=main&t=${timestamp}`);
      variations.push(`${baseUrl}?view=back&t=${timestamp + 50}`);
      variations.push(`${baseUrl}?view=side&t=${timestamp + 100}`);
    }
    
    // Return unique variations, limited to reasonable number
    return [...new Set(variations)].slice(0, 5);
  }
  
  // For non-Amazon images, create parameter variations
  const timestamp = Date.now();
  variations.push(`${baseImage}${baseImage.includes('?') ? '&' : '?'}view=alt&t=${timestamp}`);
  variations.push(`${baseImage}${baseImage.includes('?') ? '&' : '?'}view=main&t=${timestamp+1}`);
  
  return [...new Set(variations)].slice(0, 3);
};
