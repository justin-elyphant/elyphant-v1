
// Helper functions for product image handling

/**
 * Get an appropriate image URL for a specific product
 */
export const getExactProductImage = (productName: string, category: string): string => {
  const lowercaseTitle = productName.toLowerCase();
  const lowercaseCategory = category.toLowerCase();
  
  // Handle garden/planter products
  if (lowercaseCategory.includes('planter') || 
      lowercaseCategory.includes('garden') || 
      lowercaseTitle.includes('planter') || 
      lowercaseTitle.includes('plant pot') || 
      lowercaseTitle.includes('flower pot')) {
    
    // Check if it's outdoor specific
    if (lowercaseTitle.includes('outdoor') || lowercaseTitle.includes('patio')) {
      return 'https://images.unsplash.com/photo-1596521884071-39833e7ba6a6?w=500&h=500&fit=crop';
    }
    
    // Default planter image
    return 'https://images.unsplash.com/photo-1604762512526-b7068fe9474a?w=500&h=500&fit=crop';
  }
  
  // Handle Padres hat products
  if ((lowercaseTitle.includes('padres') || lowercaseTitle.includes('san diego')) && 
      (lowercaseTitle.includes('hat') || lowercaseTitle.includes('cap'))) {
    return 'https://images.unsplash.com/photo-1590075865003-e48b276c4579?w=500&h=500&fit=crop';
  }
  
  // Handle tech products
  if (lowercaseCategory.includes('electronics') || 
      lowercaseTitle.includes('headphone') || 
      lowercaseTitle.includes('speaker') || 
      lowercaseTitle.includes('laptop') || 
      lowercaseTitle.includes('tablet') || 
      lowercaseTitle.includes('phone')) {
    return 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&h=500&fit=crop';
  }
  
  // Default fallback image
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop';
};
