
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
    variations.push(`${baseUrl}?sx=500&sy=500&ex=500&ey=500`); // Square crop
    variations.push(`${baseUrl}?sx=600&sy=300&ex=600&ey=300`); // Wider crop
    
    // Add another variation with a different angle based on product type
    const productNameLower = productName.toLowerCase();
    if (productNameLower.includes('tv') || productNameLower.includes('monitor')) {
      variations.push(`${baseUrl}?angle=side`);
    } else if (productNameLower.includes('phone') || productNameLower.includes('laptop')) {
      variations.push(`${baseUrl}?angle=back`);
    } else {
      variations.push(`${baseUrl}?angle=alt`);
    }
    
    return variations;
  } 
  
  // For non-Amazon images, still try to create variations
  return [
    baseImage,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}variant=1`,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}variant=2`
  ];
}

/**
 * Get a fallback image based on product category
 */
export function getFallbackImage(category: string): string {
  switch (category.toLowerCase()) {
    case 'electronics':
      return 'https://m.media-amazon.com/images/I/71NTi82uBEL._AC_SL1500_.jpg';
    case 'footwear':
    case 'shoes':
      return 'https://m.media-amazon.com/images/I/61-Ww4OnWIL._AC_UX695_.jpg';
    case 'clothing':
      return 'https://m.media-amazon.com/images/I/71zny7BTRlL._AC_SL1500_.jpg';
    default:
      return '/placeholder.svg';
  }
}
