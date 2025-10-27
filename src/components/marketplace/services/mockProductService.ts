
import { Product } from "@/types/product";
import { allProducts } from "../zinc/data/mockProducts";

// Common search term mappings to improve search results
const searchMappings: Record<string, string[]> = {
  "airpods": ["headphones", "earbuds", "wireless", "apple"],
  "apple airpods": ["headphones", "earbuds", "wireless", "apple"],
  "iphone": ["phone", "smartphone", "mobile", "apple"],
  "macbook": ["laptop", "computer", "apple"],
  "ipad": ["tablet", "apple"],
  "watch": ["smartwatch", "fitness", "wearable"],
  "headphones": ["audio", "music", "wireless", "earbuds"],
  "laptop": ["computer", "macbook", "notebook"],
  "phone": ["smartphone", "mobile", "iphone"],
  // Footwear and sportswear mappings
  "nike": ["shoe", "shoes", "sneaker", "sneakers", "running", "trainer", "footwear", "sportswear"],
  "adidas": ["shoe", "shoes", "sneaker", "sneakers", "running", "trainer", "footwear", "sportswear"],
  "new balance": ["shoe", "shoes", "sneaker", "sneakers", "running", "trainer", "footwear"],
  "shoes": ["sneaker", "sneakers", "footwear", "running", "trainer"],
  "sneakers": ["shoe", "shoes", "footwear", "running", "trainer"],
  "running shoes": ["running", "sneaker", "sneakers", "shoe", "footwear"]
};

/**
 * Enhanced search function that uses fuzzy matching and search mappings
 */
export const searchMockProducts = (query: string, limit: number = 12): Product[] => {
  if (!query || query.trim() === "") {
    return allProducts.slice(0, limit);
  }

  const normalizedQuery = query.toLowerCase().trim();
  console.log(`Mock search for: "${normalizedQuery}"`);

  // Get additional search terms from mappings
  const additionalTerms: string[] = [];
  for (const [key, terms] of Object.entries(searchMappings)) {
    if (normalizedQuery.includes(key)) {
      additionalTerms.push(...terms);
    }
  }

  const allSearchTerms = [normalizedQuery, ...additionalTerms];
  console.log(`Searching with terms: ${allSearchTerms.join(", ")}`);

  const results = allProducts.filter(product => {
    const searchableText = [
      product.name || product.title || "",
      product.description || "",
      product.category || "",
      product.brand || "",
      ...(product.tags || [])
    ].join(" ").toLowerCase();

    // Check if any search term matches
    return allSearchTerms.some(term => {
      // Split multi-word terms and check if all words are present
      const words = term.split(" ");
      return words.every(word => searchableText.includes(word));
    });
  });

  console.log(`Mock search found ${results.length} products for "${normalizedQuery}"`);
  return results.slice(0, limit);
};

/**
 * Get mock products without search filtering
 */
export const getMockProducts = (limit: number = 12): Product[] => {
  return allProducts.slice(0, limit);
};

/**
 * Get a specific product by ID
 */
export const getMockProductById = (id: string): Product | null => {
  return allProducts.find(product => 
    product.id === id || 
    product.product_id === id
  ) || null;
};

/**
 * Get products by category
 */
export const getMockProductsByCategory = (category: string, limit: number = 12): Product[] => {
  const normalizedCategory = category.toLowerCase();
  
  const results = allProducts.filter(product => {
    const productCategory = (product.category || "").toLowerCase();
    return productCategory.includes(normalizedCategory) || 
           normalizedCategory.includes(productCategory);
  });
  
  return results.slice(0, limit);
};

/**
 * Get featured/recommended products
 */
export const getFeaturedProducts = (limit: number = 8): Product[] => {
  // Return products with high ratings or marked as featured
  const featured = allProducts.filter(product => 
    (product.rating && product.rating >= 4.5) || 
    product.isBestSeller
  );
  
  return featured.slice(0, limit);
};
