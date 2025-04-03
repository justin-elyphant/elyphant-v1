
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
    
    // Add a secondary image for better variation
    const secondaryImage = getFallbackImage(productNameLower);
    if (secondaryImage && !variations.includes(secondaryImage)) {
      variations.push(secondaryImage);
    }
    
    return variations;
  } 
  
  // For non-Amazon images, create more distinct variations
  // Use a more substantial set of variations for non-Amazon images
  return [
    baseImage,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}variant=alt&view=side`,
    `${baseImage}${baseImage.includes('?') ? '&' : '?'}variant=zoom&view=detail`,
    getFallbackImage(productName.toLowerCase()) // Add a completely different image
  ].filter(Boolean); // Remove any falsy values
}

/**
 * Get a fallback image based on product category or name
 */
export function getFallbackImage(productNameOrCategory: string): string {
  // More detailed product type detection for better fallback images
  if (productNameOrCategory.includes('food') || productNameOrCategory.includes('container') || 
      productNameOrCategory.includes('kitchen') || productNameOrCategory.includes('storage')) {
    return 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&h=500&fit=crop'; // Food containers image
  }
  if (productNameOrCategory.includes('electronics')) {
    return 'https://m.media-amazon.com/images/I/71NTi82uBEL._AC_SL1500_.jpg';
  }
  if (productNameOrCategory.includes('footwear') || productNameOrCategory.includes('shoes')) {
    return 'https://m.media-amazon.com/images/I/61-Ww4OnWIL._AC_UX695_.jpg';
  }
  if (productNameOrCategory.includes('clothing')) {
    return 'https://m.media-amazon.com/images/I/71zny7BTRlL._AC_SL1500_.jpg';
  }
  // Default fallback
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop';
}
