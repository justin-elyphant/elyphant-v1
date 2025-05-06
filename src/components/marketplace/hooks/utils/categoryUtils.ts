// Add these functions if they don't exist, or update them if they do

/**
 * Get sort options for product filtering
 */
export const getSortOptions = () => {
  return [
    { label: "Relevance", value: "relevance" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
    { label: "Rating: High to Low", value: "rating-desc" },
    { label: "Newest First", value: "newest" },
  ];
};

/**
 * Sort products based on the selected sort option
 */
export const sortProducts = (products = [], sortOption = "relevance") => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }
  
  const productsCopy = [...products];
  
  switch (sortOption) {
    case "price-asc":
      return productsCopy.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const priceB = typeof b.price === 'number' ? b.price : 0;
        return priceA - priceB;
      });
      
    case "price-desc":
      return productsCopy.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const priceB = typeof b.price === 'number' ? b.price : 0;
        return priceB - priceA;
      });
      
    case "rating-desc":
      return productsCopy.sort((a, b) => {
        const ratingA = a.rating || a.stars || 0;
        const ratingB = b.rating || b.stars || 0;
        return ratingB - ratingA;
      });
      
    case "newest":
      // Since we don't have a date field, we'll just reverse the array
      // This assumes the most recent products are at the end
      return productsCopy.reverse();
      
    case "relevance":
    default:
      // Keep the original order for relevance
      return productsCopy;
  }
};
