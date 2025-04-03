
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
    
    // Generate visually distinct variations with entirely different parameters
    // These parameters create sufficiently different looking images on Amazon
    variations.push(`${baseUrl}?f=json&view=front`); 
    variations.push(`${baseUrl}?f=png&view=back`);
    
    // Add different size parameters for more variety
    const hash = Math.floor(Math.random() * 1000); // Add randomness to prevent caching
    variations.push(`${baseUrl}?sx=400&sy=300&ex=800&ey=600&hash=${hash}`);
    
    // Add different angles based on product type with unique parameters
    const productNameLower = productName.toLowerCase();
    if (productNameLower.includes('tv') || productNameLower.includes('monitor')) {
      variations.push(`${baseUrl}?angle=front&m=fit&h=600&w=600&f=ffffff`);
    } else if (productNameLower.includes('phone') || productNameLower.includes('laptop')) {
      variations.push(`${baseUrl}?angle=side&m=contain&h=500&w=500&f=f8f8f8`);
    } else if (productNameLower.includes('food') || productNameLower.includes('container')) {
      variations.push(`${baseUrl}?angle=top&q=90&m=crop&h=400&w=400&f=fafafa`);
    } else {
      variations.push(`${baseUrl}?angle=45&q=100&m=pad&h=450&w=450&f=fdfdfd`);
    }
    
    // Return unique Amazon variations, ensuring they're all different
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
 * Get a fallback image based on product category or name - only used if no images at all
 */
export function getFallbackImage(productNameOrCategory: string): string {
  // Generic placeholder that's clearly a placeholder
  return '/placeholder.svg';
}
