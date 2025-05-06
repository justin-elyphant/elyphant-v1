
/**
 * Format price to always show 2 decimal places
 */
export const formatProductPrice = (price: number): string => {
  if (price == null) return "No Price";
  
  // Check if price is already in dollars or in cents
  if (price > 1000) {
    // Assume price is in cents, convert to dollars
    return (price/100).toFixed(2);
  } else {
    // Assume price is already in dollars
    return price.toFixed(2);
  }
};

/**
 * Helper utility to ensure product has both id and product_id fields
 */
export const normalizeProductId = (product: any): any => {
  return {
    ...product,
    id: product.id || product.product_id || `product-${Math.random().toString(36).substring(2, 9)}`,
    product_id: product.product_id || product.id
  };
};

/**
 * Helper utility to normalize product title and name
 */
export const normalizeProductName = (product: any): any => {
  return {
    ...product,
    name: product.name || product.title || 'Unnamed Product',
    title: product.title || product.name || 'Unnamed Product'
  };
};
