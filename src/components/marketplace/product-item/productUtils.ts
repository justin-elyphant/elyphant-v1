
/**
 * Format price to always show 2 decimal places
 */
export const formatProductPrice = (price: number | null | undefined): string => {
  if (price == null) return "No Price";
  
  // Handle edge cases where price might be in cents (common for e-commerce systems)
  if (price > 1000000) {
    // Very large number, likely needs special formatting
    return (price/100).toFixed(2);
  } else if (price > 0 && price < 0.1) {
    // Very small price, likely in incorrect format
    return (price * 100).toFixed(2);
  }
  
  return price.toFixed(2);
};

/**
 * Convert price to a consistent format if needed
 */
export const normalizePrice = (price: any): number => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') return parseFloat(price) || 0;
  return 0;
};

/**
 * Helper function for accessing product ID consistently regardless of source
 */
export const getProductId = (product: any): string => {
  return String(product.product_id || product.id || '');
};

/**
 * Helper function for accessing product name/title consistently
 */
export const getProductName = (product: any): string => {
  return product.name || product.title || 'Unknown Product';
};

/**
 * Helper function for accessing product category consistently
 */
export const getProductCategory = (product: any): string => {
  return product.category || product.category_name || 'Uncategorized';
};

/**
 * Helper function for accessing vendor/retailer consistently
 */
export const getProductVendor = (product: any): string => {
  return product.vendor || product.retailer || 'Unknown Vendor';
};

/**
 * Helper function for accessing rating consistently
 */
export const getProductRating = (product: any): number => {
  return product.rating || product.stars || 0;
};

/**
 * Helper function for accessing review count consistently
 */
export const getProductReviewCount = (product: any): number => {
  return product.reviewCount || product.num_reviews || 0;
};
