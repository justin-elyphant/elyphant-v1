
/**
 * Format a product price with proper decimals
 */
export const formatProductPrice = (price?: number): string => {
  if (price === undefined || price === null) {
    return "0.00";
  }
  return price.toFixed(2);
};

/**
 * Get a clean product title by removing excessive capitalization and
 * truncating if necessary
 */
export const getCleanTitle = (title: string): string => {
  if (!title) return "";
  
  // Remove excessive capitalization
  let cleanTitle = title.replace(/\b[A-Z]{2,}\b/g, (match) => 
    match.charAt(0) + match.slice(1).toLowerCase()
  );
  
  // Truncate title if too long
  if (cleanTitle.length > 60) {
    cleanTitle = cleanTitle.substring(0, 57) + "...";
  }
  
  return cleanTitle;
};
