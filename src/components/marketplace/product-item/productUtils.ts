
/**
 * Format price to always show 2 decimal places
 */
export const formatProductPrice = (price: number | undefined): string => {
  if (price == null) return "No Price";
  return (price/100).toFixed(2);
};
