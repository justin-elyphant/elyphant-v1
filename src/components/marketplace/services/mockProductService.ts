import { Product } from "@/contexts/ProductContext";
import { generateMockProductResults, createMockResults } from "../zinc/utils/mockResultsGenerator";
import { normalizeProduct } from "@/contexts/ProductContext";
import { getProductFallbackImage } from "../product-item/productImageUtils";

/**
 * Get a set of mock products for testing and fallback scenarios
 * @param count Number of mock products to generate
 * @returns An array of standardized mock products
 */
export const getMockProducts = (count: number = 10): Product[] => {
  const mockResults = generateMockProductResults("electronics", count);
  
  return mockResults.map((result, index) => {
    // Always use a reliable placeholder image
    const imageUrl =
      result.image && result.image !== "/placeholder.svg" && result.image !== null
        ? result.image
        : getReliablePlaceholderImage(index, result.category || "Electronics");

    // Ensure the images array is never empty and doesn't contain any grey boxes
    const imagesArr = [imageUrl];
    return normalizeProduct({
      product_id: `mock-${index}-${Date.now()}`,
      id: `mock-${index}-${Date.now()}`,
      title: result.title || "Mock Product",
      name: result.title || "Mock Product",
      price: result.price || (19.99 + index),
      image: imageUrl,
      description: result.description || "This is a mock product for testing purposes.",
      category: result.category || "Electronics",
      vendor: "Mock Vendor",
      brand: result.brand || "Mock Brand",
      rating: result.rating || 4.5,
      reviewCount: result.review_count || 42,
      images: imagesArr,
    });
  });
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
  
  // Handle interest-based personalization
  const interestTerms = [
    "photography", "hiking", "cooking", "reading", "gaming", 
    "gardening", "fitness", "music", "technology", "travel",
    "art", "sports", "fashion", "beauty", "home"
  ];
  
  // Check if the query contains any known interests
  const matchedInterests = interestTerms.filter(interest => 
    lowerQuery.includes(interest)
  );
  
  if (matchedInterests.length > 0) {
    // Create personalized results based on matched interests
    const interest = matchedInterests[0]; // Use the first matched interest
    const mockResults = createMockResults(
      query,
      `${interest.charAt(0).toUpperCase() + interest.slice(1)} Products`,
      count,
      4.0,
      5.0,
      interestToBrand(interest)
    );
    
    return mockResults.map((result, index) => {
      // Always use a reliable placeholder image
      const imageUrl =
        result.image && result.image !== "/placeholder.svg" && result.image !== null
          ? result.image
          : getReliablePlaceholderImage(index, interest);
      const imagesArr = [imageUrl];
      return normalizeProduct({
        product_id: `personalized-${interest}-${index}-${Date.now()}`,
        title: result.title || `${interest.charAt(0).toUpperCase() + interest.slice(1)} Gift`,
        price: result.price || (29.99 + index * 5),
        image: imageUrl,
        category: result.category || interest.charAt(0).toUpperCase() + interest.slice(1),
        vendor: brandToVendor(interestToBrand(interest)),
        description: result.description || `Perfect gift for ${interest} enthusiasts`,
        rating: result.rating || 4.5,
        reviewCount: result.review_count || 30 + Math.floor(Math.random() * 50),
        images: imagesArr,
      });
    });
  }
  
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
    
    return mockResults.map((result, index) => {
      const imageUrl =
        result.image && result.image !== "/placeholder.svg" && result.image !== null
          ? result.image
          : getReliablePlaceholderImage(index, "Gifts");
      const imagesArr = [imageUrl];
      return normalizeProduct({
        product_id: `search-${index}-${Date.now()}`,
        title: result.title || `${query} Gift`,
        price: result.price || (29.99 + index * 10),
        image: imageUrl,
        category: result.category,
        vendor: "Amazon via Zinc",
        description: result.description || `Perfect ${query} gift option`,
        rating: result.rating,
        reviewCount: result.review_count,
        images: imagesArr,
      });
    });
  }
  
  // Default mock search results
  const mockResults = generateMockProductResults(query, count);
  
  return mockResults.map((result, index) => {
    const imageUrl =
      result.image && result.image !== "/placeholder.svg" && result.image !== null
        ? result.image
        : getReliablePlaceholderImage(index, result.category || "Products");
    const imagesArr = [imageUrl];
    return normalizeProduct({
      product_id: `search-${index}-${Date.now()}`,
      title: result.title || `${query} Product`,
      price: result.price || (19.99 + index * 5),
      image: imageUrl,
      category: result.category || "Electronics",
      vendor: "Amazon via Zinc",
      description: result.description || `Product matching your search for ${query}`,
      rating: result.rating || 4.0,
      reviewCount: result.review_count || 28,
      images: imagesArr,
    });
  });
};

/**
 * Generate a reliable placeholder image that's visually appealing
 * @param index The index of the product
 * @param category The category to use for image selection
 * @returns A URL string to a reliable placeholder image 
 */
const getReliablePlaceholderImage = (index: number, category: string): string => {
  // Use Unsplash images for reliable, high-quality placeholders
  const placeholderImages = [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop", // Headphones
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop", // Headphones
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop", // Shoes
    "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&h=500&fit=crop", // Shoes
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop", // Watch
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop", // Watch
    "https://images.unsplash.com/photo-1585565804112-f201f68c48b4?w=500&h=500&fit=crop", // Apple Products
    "https://images.unsplash.com/photo-1592434134753-a70baf7979d5?w=500&h=500&fit=crop", // Skincare
    "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=500&h=500&fit=crop", // Gaming
    "https://images.unsplash.com/photo-1596521884071-39833e7ba6a6?w=500&h=500&fit=crop", // Plants
  ];
  
  // Get a deterministic but varied index based on the product index and category
  const categoryHash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageIndex = (index + categoryHash) % placeholderImages.length;
  
  return placeholderImages[imageIndex];
};

/**
 * Map an interest to a relevant brand
 */
function interestToBrand(interest: string): string {
  const brandMap: Record<string, string> = {
    'photography': 'Canon',
    'hiking': 'North Face',
    'cooking': 'KitchenAid',
    'reading': 'Kindle',
    'gaming': 'Nintendo',
    'gardening': 'Miracle-Gro',
    'fitness': 'Nike',
    'music': 'Bose',
    'technology': 'Apple',
    'travel': 'Samsonite',
    'art': 'Prismacolor',
    'sports': 'Adidas',
    'fashion': 'Zara',
    'beauty': 'Sephora',
    'home': 'IKEA'
  };
  
  return brandMap[interest] || 'TopBrand';
}

/**
 * Map a brand to a vendor
 */
function brandToVendor(brand: string): string {
  const vendorMap: Record<string, string> = {
    'Canon': 'BestBuy via Zinc',
    'North Face': 'REI via Zinc',
    'KitchenAid': 'Williams-Sonoma via Zinc',
    'Kindle': 'Amazon via Zinc',
    'Nintendo': 'GameStop via Zinc',
    'Miracle-Gro': 'Home Depot via Zinc',
    'Nike': 'Nike Store via Zinc',
    'Bose': 'Bose Store via Zinc',
    'Apple': 'Apple Store via Zinc',
    'Samsonite': 'Macy\'s via Zinc',
    'Prismacolor': 'Michaels via Zinc',
    'Adidas': 'Adidas Store via Zinc',
    'Zara': 'Zara via Zinc',
    'Sephora': 'Sephora via Zinc',
    'IKEA': 'IKEA via Zinc'
  };
  
  return vendorMap[brand] || 'Amazon via Zinc';
}
