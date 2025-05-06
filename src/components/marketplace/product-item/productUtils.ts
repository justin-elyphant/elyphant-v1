
/**
 * Format price to always show 2 decimal places
 */
export const formatProductPrice = (price: number | undefined | null): string => {
  if (price == null || price === undefined) return "N/A";
  return price.toFixed(2);
};
