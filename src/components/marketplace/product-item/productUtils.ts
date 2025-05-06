
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
