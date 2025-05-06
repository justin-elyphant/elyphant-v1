
/**
 * Format price to always show 2 decimal places
 */
export const formatProductPrice = (price: number): string => {
  if (price == null) return "No Price";
  return price.toFixed(2);
};
