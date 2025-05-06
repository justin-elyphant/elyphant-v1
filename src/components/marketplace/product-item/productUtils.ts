
/**
 * Format price to always show 2 decimal places
 */
export const formatProductPrice = (price: number | string): string => {
  if (price == null) return "No Price";
  
  // Convert string to number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Check if price is already in dollars or in cents
  if (numericPrice > 1000) {
    // Assume price is in cents, convert to dollars
    return (numericPrice/100).toFixed(2);
  } else {
    // Assume price is already in dollars
    return numericPrice.toFixed(2);
  }
};

/**
 * Helper utility to ensure product has both id and product_id fields
 */
export const normalizeProductId = (product: any): any => {
  // Generate a consistent product ID if missing
  const productId = product.product_id || product.id || `product-${Math.random().toString(36).substring(2, 9)}`;
  
  return {
    ...product,
    id: productId,
    product_id: productId
  };
};

/**
 * Helper utility to normalize product title and name
 */
export const normalizeProductName = (product: any): any => {
  const productName = product.name || product.title || 'Unnamed Product';
  
  return {
    ...product,
    name: productName,
    title: productName
  };
};

/**
 * Complete product normalization that ensures a product has all required fields
 */
export const normalizeProduct = (product: any): any => {
  // First normalize the ID and name
  let normalized = normalizeProductId(normalizeProductName(product));
  
  // Ensure consistent price format (always a number)
  if (normalized.price !== undefined && typeof normalized.price !== 'number') {
    normalized.price = parseFloat(String(normalized.price)) || 0;
  }
  
  // Ensure other required properties exist
  normalized = {
    ...normalized,
    // Default values for missing properties
    image: normalized.image || normalized.images?.[0] || '/placeholder.svg',
    images: normalized.images || (normalized.image ? [normalized.image] : ['/placeholder.svg']),
    category: normalized.category || 'Uncategorized',
    vendor: normalized.vendor || 'Unknown',
    description: normalized.description || `${normalized.name} - no description available`,
    // Normalize ratings
    rating: normalized.rating || normalized.stars || 0,
    stars: normalized.stars || normalized.rating || 0,
    reviewCount: normalized.reviewCount || normalized.num_reviews || 0,
    num_reviews: normalized.num_reviews || normalized.reviewCount || 0
  };
  
  return normalized;
};
