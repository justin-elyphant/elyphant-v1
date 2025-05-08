
/**
 * Utility functions for product image handling
 */

/**
 * Generates a fallback image URL for products when image is missing
 * @param productName The name of the product
 * @param category Optional category of the product
 * @returns A placeholder image URL
 */
export const getProductFallbackImage = (productName: string, category?: string): string => {
  // Map common categories to specific image URLs for better user experience
  const categoryImageMap: Record<string, string> = {
    'electronics': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&h=500&fit=crop',
    'footwear': 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500&h=500&fit=crop',
    'apparel': 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&h=500&fit=crop',
    'shoes': 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500&h=500&fit=crop',
    'kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&h=500&fit=crop',
    'home': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500&h=500&fit=crop'
  };

  // Standardize category for matching
  const normalizedCategory = category?.toLowerCase() || '';
  
  // Check for brand-specific images
  const lowerName = productName.toLowerCase();
  
  if (lowerName.includes('nike')) {
    return 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/7fbc5e94-8d49-4730-a280-f19d3cfad0b0/air-max-90-mens-shoes-6n3vKB.png';
  }
  
  if (lowerName.includes('apple')) {
    return 'https://images.unsplash.com/photo-1585565804112-f201f68c48b4?w=500&h=500&fit=crop';
  }

  // Find matching category or use default
  for (const [key, url] of Object.entries(categoryImageMap)) {
    if (normalizedCategory.includes(key)) {
      return url;
    }
  }

  // Default fallback image if no matches
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
};

/**
 * Check if an image URL is valid/usable
 * @param url The image URL to check
 * @returns boolean indicating if the URL is likely valid
 */
export const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  
  // Check for common placeholder or empty URLs
  if (url === '/placeholder.svg' || 
      url === 'null' || 
      url === 'undefined' || 
      url.trim() === '') {
    return false;
  }
  
  // Check for common image extensions
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const hasValidExtension = validExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  // Return true if URL has a valid extension or starts with http(s)
  return hasValidExtension || url.startsWith('http');
};
