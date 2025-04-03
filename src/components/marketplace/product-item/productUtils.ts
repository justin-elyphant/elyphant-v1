
/**
 * Format price to always show 2 decimal places
 */
export const formatProductPrice = (price: number): string => {
  return price.toFixed(2);
};
