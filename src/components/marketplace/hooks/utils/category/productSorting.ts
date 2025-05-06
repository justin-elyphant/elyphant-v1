
import { Product } from "@/contexts/ProductContext";

/**
 * Sort products based on the selected sort option
 */
export const sortProducts = (products: Product[], sortOption: string) => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }
  
  const productsCopy = [...products];
  
  switch (sortOption) {
    case 'price-low':
      return productsCopy.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const priceB = typeof b.price === 'number' ? b.price : 0;
        return priceA - priceB;
      });
    case 'price-high':
      return productsCopy.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const priceB = typeof b.price === 'number' ? b.price : 0;
        return priceB - priceA;
      });
    case 'rating':
      return productsCopy.sort((a, b) => {
        const ratingA = a.stars || a.rating || 0;
        const ratingB = b.stars || b.rating || 0;
        return ratingB - ratingA;
      });
    case 'reviews':
      return productsCopy.sort((a, b) => (b.num_reviews || 0) - (a.num_reviews || 0));
    case 'newest':
      // For demo purposes, we'll just shuffle the products
      return productsCopy.sort(() => Math.random() - 0.5);
    case 'relevance':
    default:
      return productsCopy;
  }
};
