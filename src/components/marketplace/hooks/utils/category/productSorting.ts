
import { Product } from "@/contexts/ProductContext";

/**
 * Sort products based on the selected sort option
 * Optimized for performance with null checks and limited iterations
 */
export const sortProducts = (products: Product[], sortOption: string) => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }
  
  // Create a shallow copy to avoid mutating the original array
  const productsCopy = [...products];
  
  // Use efficient sort comparators based on option
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
        // Use nullish coalescing for more efficient null/undefined handling
        const ratingA = a.stars ?? a.rating ?? 0;
        const ratingB = b.stars ?? b.rating ?? 0;
        return ratingB - ratingA;
      });
    case 'reviews':
      return productsCopy.sort((a, b) => {
        const reviewsA = a.num_reviews ?? a.reviewCount ?? 0;
        const reviewsB = b.num_reviews ?? b.reviewCount ?? 0;
        return reviewsB - reviewsA;
      });
    case 'newest':
      // For demo purposes, we'll just shuffle the products
      return productsCopy.sort(() => Math.random() - 0.5);
    case 'relevance':
    default:
      return productsCopy;
  }
};
