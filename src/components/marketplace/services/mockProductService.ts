
import { Product } from "@/contexts/ProductContext";
import { generateMockProductResults, createMockResults } from "../zinc/utils/mockResultsGenerator";
import { normalizeProduct } from "@/contexts/ProductContext";

/**
 * Get a set of mock products for testing and fallback scenarios
 * @param count Number of mock products to generate
 * @returns An array of standardized mock products
 */
export const getMockProducts = (count: number = 10): Product[] => {
  const mockResults = generateMockProductResults("electronics", count);
  
  return mockResults.map((result, index) => normalizeProduct({
    product_id: `mock-${index}-${Date.now()}`,
    id: `mock-${index}-${Date.now()}`,
    title: result.title || "Mock Product",
    name: result.title || "Mock Product",
    price: result.price || (19.99 + index),
    image: result.image || "/placeholder.svg",
    description: result.description || "This is a mock product for testing purposes.",
    category: result.category || "Electronics",
    vendor: "Mock Vendor",
    brand: result.brand || "Mock Brand",
    rating: result.rating || 4.5,
    reviewCount: result.review_count || 42,
    images: [result.image || "/placeholder.svg"]
  }));
};

/**
 * Search for mock products based on a query string
 * @param query Search query string
 * @param count Maximum number of results to return
 * @returns An array of mock products matching the search query
 */
export const searchMockProducts = (query: string, count: number = 10): Product[] => {
  // Check if it's a special case search
  const lowerQuery = query.toLowerCase();
  
  // Handle category-specific searches
  if (lowerQuery.includes("gift") || 
      lowerQuery.includes("birthday") || 
      lowerQuery.includes("anniversary")) {
    
    // Create gift-specific mock results
    const mockResults = createMockResults(
      query,
      lowerQuery.includes("birthday") ? "Birthday Gifts" : 
        lowerQuery.includes("anniversary") ? "Anniversary Gifts" : "Gifts",
      count,
      4.0,
      5.0,
      lowerQuery.includes("nike") ? "Nike" : 
        lowerQuery.includes("apple") ? "Apple" : "GiftBrand"
    );
    
    return mockResults.map((result, index) => normalizeProduct({
      product_id: `search-${index}-${Date.now()}`,
      title: result.title || `${query} Gift`,
      price: result.price || (29.99 + index * 10),
      image: result.image || "/placeholder.svg",
      category: result.category,
      vendor: "Amazon via Zinc",
      description: result.description || `Perfect ${query} gift option`,
      rating: result.rating,
      reviewCount: result.review_count
    }));
  }
  
  // Default mock search results
  const mockResults = generateMockProductResults(query, count);
  
  return mockResults.map((result, index) => normalizeProduct({
    product_id: `search-${index}-${Date.now()}`,
    title: result.title || `${query} Product`,
    price: result.price || (19.99 + index * 5),
    image: result.image || "/placeholder.svg", 
    category: result.category || "Electronics",
    vendor: "Amazon via Zinc",
    description: result.description || `Product matching your search for ${query}`,
    rating: result.rating || 4.0,
    reviewCount: result.review_count || 28
  }));
};
