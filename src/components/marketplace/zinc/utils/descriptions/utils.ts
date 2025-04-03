
/**
 * Extracts the product type from a product name
 */
export const extractProductType = (productName: string): string => {
  const words = productName.split(' ');
  
  // Skip the brand (first word) and try to find a good product type
  if (words.length > 2) {
    // For longer names, use the last 2-3 words as the product type
    return words.slice(-3).join(' ');
  } else if (words.length > 1) {
    // For shorter names, use all but the first word
    return words.slice(1).join(' ');
  }
  
  // Fallback to "product" if we can't extract a good type
  return "product";
};
