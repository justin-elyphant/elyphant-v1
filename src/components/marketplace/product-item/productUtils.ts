
/**
 * Format price to always show 2 decimal places
 */
export const formatProductPrice = (price: number): string => {
  if (price == null || isNaN(price)) return "No Price";
  
  // Handle case where price is already in cents (larger numbers)
  if (price > 1000) {
    return (price/100).toFixed(2);
  }
  
  return price.toFixed(2);
};
