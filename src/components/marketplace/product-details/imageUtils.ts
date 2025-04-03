
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
    const baseUrl = baseImage.split('?')[0];
    
    // Generate visually distinct variations with different size parameters
    // Use more significantly different parameters to make visually distinct images
    variations.push(`${baseUrl}?sx=300&sy=300&ex=600&ey=600`); // Zoomed crop
    variations.push(`${baseUrl}?sx=0&sy=0&ex=800&ey=400`); // Wide view
    
    // Add different angles based on product type
    const productNameLower = productName.toLowerCase();
    if (productNameLower.includes('tv') || productNameLower.includes('monitor')) {
      variations.push(`${baseUrl}?angle=front&f=ffffff`); // Front with white background
    } else if (productNameLower.includes('phone') || productNameLower.includes('laptop')) {
      variations.push(`${baseUrl}?angle=side&f=f8f8f8`); // Side view with light gray background
    } else if (productNameLower.includes('food') || productNameLower.includes('container')) {
      variations.push(`${baseUrl}?angle=top&f=fafafa`); // Top view for containers/food
    } else {
      variations.push(`${baseUrl}?angle=back&f=fdfdfd`); // Back view with slight background
    }
    
    // Return only Amazon variations, without any fallback images
    return variations;
  } 
  
  // For non-Amazon images, create more distinct variations
  // But don't add generic fallback images
  return [
    baseImage,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}variant=alt&view=side`,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}variant=zoom&view=detail`,
  ].filter(Boolean); // Remove any falsy values
}

/**
 * Get a fallback image based on product category or name - only used if no images at all
 */
export function getFallbackImage(productNameOrCategory: string): string {
  // Generic placeholder that's clearly a placeholder
  return '/placeholder.svg';
}
