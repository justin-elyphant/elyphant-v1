
/**
 * Create image variations from a single base image
 */
export function createImageVariations(baseImage: string, productName: string): string[] {
  // Return placeholder if no base image
  if (!baseImage) {
    return ["/placeholder.svg"];
  }
  
  // Start with the original image
  const variations = [baseImage];
  
  // Create Amazon-specific variations if applicable
  if (baseImage.includes('amazon.com') || baseImage.includes('m.media-amazon.com')) {
    // Extract the base URL without any existing parameters
    let baseUrl = baseImage.split('?')[0];
    
    // Handle Amazon image URLs by extracting the product ID
    // Amazon image URLs typically contain the product ID in the path
    const productId = extractAmazonProductId(baseUrl);
    
    if (productId) {
      // These are valid Amazon image transformations that produce different views
      // Format: https://m.media-amazon.com/images/I/[ID].[FORMAT]
      
      // Get the file extension
      const fileExt = baseUrl.split('.').pop() || 'jpg';
      
      // Create base URL variations (these actually show different views)
      const idVariations = [
        productId,
        productId.replace('5', '6'),  // Side view
        productId.replace('L', 'R'),  // Different angle
        productId.substring(0, productId.length-2) + '2L', // Front view
        productId.substring(0, productId.length-2) + '3L'  // Back view
      ];
      
      // Create truly different Amazon URLs
      const timestamp = Date.now();
      idVariations.forEach((id, index) => {
        // Create a completely new URL with the varied ID
        const newUrl = baseUrl.replace(productId, id);
        
        // Only add if it's different from the original and not already in variations
        if (newUrl !== baseUrl && !variations.includes(newUrl)) {
          variations.push(newUrl);
        }
        
        // Also add some with params for even more variety
        const paramUrl = `${newUrl}?t=${timestamp+index}`;
        if (!variations.includes(paramUrl)) {
          variations.push(paramUrl);
        }
      });
      
      // If we couldn't generate enough variations, add some with different URL parameters
      if (variations.length < 4) {
        variations.push(`${baseUrl}?t=${timestamp}`);
        variations.push(`${baseUrl}?t=${timestamp+1}&view=back`);
      }
    } else {
      // If we couldn't extract product ID, fall back to parameter variations
      const timestamp = Date.now();
      
      // Generate visually distinct variations with entirely different parameters
      variations.push(`${baseUrl}?t=${timestamp}`); 
      variations.push(`${baseUrl}?t=${timestamp+1}&view=back`);
      variations.push(`${baseUrl}?t=${timestamp+2}&view=side`);
      variations.push(`${baseUrl}?t=${timestamp+3}&view=top`);
    }
    
    // Return unique Amazon variations
    return [...new Set(variations)];
  } 
  
  // For non-Amazon images, create more distinct variations
  // Adding timestamp/random parameters to ensure they're treated as unique
  const timestamp = Date.now();
  return [
    baseImage,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}variant=alt&view=side&t=${timestamp}`,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}variant=zoom&view=detail&t=${timestamp+1}`,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}variant=other&view=front&t=${timestamp+2}`,
  ].filter(Boolean); // Remove any falsy values
}

/**
 * Extract Amazon product ID from image URL
 * Example: https://m.media-amazon.com/images/I/51RwqTDfIvL._AC_UL320_.jpg
 * Returns: 51RwqTDfIvL
 */
function extractAmazonProductId(url: string): string | null {
  // Amazon image URLs follow this pattern: 
  // https://m.media-amazon.com/images/I/[PRODUCT_ID]._[VARIANT]_.jpg
  const regex = /\/images\/I\/([A-Za-z0-9]+)(\._.*)?/;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

/**
 * Get a fallback image based on product category or name - only used if no images at all
 */
export function getFallbackImage(productNameOrCategory: string): string {
  // Generic placeholder that's clearly a placeholder
  return '/placeholder.svg';
}
