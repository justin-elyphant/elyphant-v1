
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
    'home': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500&h=500&fit=crop',
    'gifts': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&h=500&fit=crop',
    'birthday': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&h=500&fit=crop',
    'anniversary': 'https://images.unsplash.com/photo-1527356900876-cae61d8d8462?w=500&h=500&fit=crop',
    'mother': 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=500&h=500&fit=crop',
    'technology': 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&h=500&fit=crop',
    'gaming': 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&h=500&fit=crop'
  };

  // Standardize category for matching
  const normalizedCategory = category?.toLowerCase() || '';
  
  // Check for brand-specific images
  const lowerName = productName.toLowerCase();
  
  // Check for specific products in name
  if (lowerName.includes('nike')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
  }
  
  if (lowerName.includes('apple')) {
    return 'https://images.unsplash.com/photo-1585565804112-f201f68c48b4?w=500&h=500&fit=crop';
  }

  if (lowerName.includes('mother') && (lowerName.includes('day') || lowerName.includes('gift'))) {
    return 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=500&h=500&fit=crop';
  }
  
  if (lowerName.includes('padres') || (lowerName.includes('hat') && lowerName.includes('san diego'))) {
    return 'https://images.unsplash.com/photo-1590075865003-e48b276c4579?w=500&h=500&fit=crop';
  }

  // Find matching category or use default
  for (const [key, url] of Object.entries(categoryImageMap)) {
    if (normalizedCategory.includes(key) || lowerName.includes(key)) {
      return url;
    }
  }

  // Use these as general fallbacks for any product
  const generalFallbacks = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop', // Headphones
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop', // Watch
    'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&h=500&fit=crop'  // Running Shoes
  ];
  
  // Use product name to pick a consistent image
  const nameHash = lowerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return generalFallbacks[nameHash % generalFallbacks.length];
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
