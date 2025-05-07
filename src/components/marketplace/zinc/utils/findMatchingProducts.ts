
import { ZincProduct } from '../types';
// Remove the imports that conflict with local declarations
// import { getImageCategory } from './categoryMapper';
// import { isProductRelevantToSearch } from './productConverter';

/**
 * Cache to store recently searched products to improve performance
 */
const searchCache: Record<string, { timestamp: number, results: ZincProduct[] }> = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Cleans up old cache entries
 */
const cleanupCache = () => {
  const now = Date.now();
  Object.keys(searchCache).forEach(key => {
    if (now - searchCache[key].timestamp > CACHE_EXPIRY) {
      delete searchCache[key];
    }
  });
};

/**
 * Create mock results for a search query
 */
const createMockResults = (
  query: string,
  category: string = "Electronics",
  count: number = 10,
  minRating: number = 3.0,
  maxRating: number = 5.0,
  brand?: string,
  useDetailedImages: boolean = false
): ZincProduct[] => {
  const results: ZincProduct[] = [];
  const terms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  
  for (let i = 0; i < count; i++) {
    // Generate a random rating between min and max rating
    const rating = Number((Math.random() * (maxRating - minRating) + minRating).toFixed(1));
    // Generate a random price between $15 and $500
    const price = Number((Math.random() * 485 + 15).toFixed(2));
    // Generate a random number of reviews between 5 and 1000
    const reviewCount = Math.floor(Math.random() * 995) + 5;
    
    // Generate a title using the search terms and some common words
    let title = "";
    if (brand) {
      title += brand + " ";
    }
    
    // Add the main term to the title
    title += capitalizeFirstLetter(terms[0] || "Product");
    
    // Add some descriptive words based on the category
    if (category === "Electronics") {
      title += ` ${["Premium", "Pro", "Wireless", "Smart", "Digital"][i % 5]} ${["Device", "Gadget", "Technology", "Equipment", "System"][i % 5]}`;
    } else if (category === "Clothing") {
      title += ` ${["Casual", "Formal", "Stylish", "Comfortable", "Trendy"][i % 5]} ${["Shirt", "Pants", "Jacket", "Dress", "Outfit"][i % 5]}`;
    } else {
      title += ` ${["Quality", "Professional", "Deluxe", "Advanced", "Essential"][i % 5]} ${["Item", "Product", "Solution", "Selection", "Choice"][i % 5]}`;
    }
    
    // Generate a unique ID
    const productId = `mock-${query.replace(/\s+/g, '-').toLowerCase()}-${i}`;
    
    const result: ZincProduct = {
      product_id: productId,
      title: title,
      price: price,
      rating: rating,
      review_count: reviewCount,
      image: getImageUrl(query, category),
      images: [getImageUrl(query, category)],
      brand: brand || ["Apple", "Samsung", "Sony", "Nike", "Adidas"][i % 5],
      category: category,
      description: `This ${title.toLowerCase()} is a high-quality ${category.toLowerCase()} product that perfectly matches your search for "${query}". It comes with great features and has received excellent customer reviews.`,
      retailer: "Amazon" // Added the required retailer property
    };
    
    results.push(result);
  }
  
  return results;
};

/**
 * Generate an image URL for a product based on the search query and category
 */
const getImageUrl = (query: string, category: string): string => {
  // Simple placeholder image
  return `/placeholder.svg`;
};

/**
 * Simple utility to capitalize the first letter of a string
 */
const capitalizeFirstLetter = (string: string): string => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Finds products that match the search query with support for misspelled terms
 * With caching for performance improvements
 */
export const findMatchingProducts = (query: string): ZincProduct[] => {
  // Clean expired cache entries occasionally
  if (Math.random() < 0.1) cleanupCache();
  
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Check cache first
  if (searchCache[lowercaseQuery] && 
      Date.now() - searchCache[lowercaseQuery].timestamp < CACHE_EXPIRY) {
    console.log(`Using cached results for "${lowercaseQuery}"`);
    return searchCache[lowercaseQuery].results;
  }
  
  console.log(`SearchUtils: Searching for "${lowercaseQuery}"`);
  
  // Special case for San Diego Padres hat searches
  if ((lowercaseQuery.includes("padres") || lowercaseQuery.includes("san diego")) && 
      (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
    const specificQuery = "san diego padres baseball hat clothing apparel";
    console.log(`SearchUtils: Using specific query for Padres hat: "${specificQuery}"`);
    
    // Create custom results for Padres hats
    const padresHatResults = createMockResults(
      specificQuery, 
      "Baseball Team Merchandise", 
      20, 
      4.0, 
      5.0, 
      "San Diego Padres", 
      true
    );
    
    // Filter out irrelevant products
    const filteredPadresResults = padresHatResults.filter(product => {
      // Ensure explicit clothing category for hat searches
      product.category = "Baseball Team Apparel";
      return isProductRelevantToSearch(product, specificQuery);
    });
    
    console.log(`SearchUtils: Generated ${filteredPadresResults.length} custom Padres hat results`);
    
    // Cache the results before returning
    searchCache[lowercaseQuery] = {
      timestamp: Date.now(),
      results: filteredPadresResults
    };
    
    return filteredPadresResults;
  }
  
  // Get appropriate image category
  const imageCategory = getImageCategory(lowercaseQuery);
  
  // Generic search - limit to 50 products max for better performance
  const genericResults = createMockResults(lowercaseQuery, imageCategory, 50, 3.5, 5.0, undefined, true);
  
  // Filter out irrelevant products
  const filteredGenericResults = genericResults
    .filter(product => isProductRelevantToSearch(product, lowercaseQuery))
    .slice(0, 50);
  
  console.log(`SearchUtils: Generated ${filteredGenericResults.length} relevant generic results`);
  
  // Cache the results before returning
  searchCache[lowercaseQuery] = {
    timestamp: Date.now(),
    results: filteredGenericResults
  };
  
  return filteredGenericResults;
};

/**
 * Determine image category based on search query
 */
export const getImageCategory = (searchQuery: string): string => {
  const query = searchQuery.toLowerCase();
  
  if (query.includes("electronics") || query.includes("gadget") || 
      query.includes("laptop") || query.includes("phone") || 
      query.includes("camera") || query.includes("computer") ||
      query.includes("earbuds") || query.includes("headphones") ||
      query.includes("apple") || query.includes("samsung")) {
    return "Electronics";
  }
  
  if (query.includes("clothing") || query.includes("shirt") || 
      query.includes("pants") || query.includes("dress") || 
      query.includes("jacket") || query.includes("hat") ||
      query.includes("shoes") || query.includes("nike") ||
      query.includes("adidas") || query.includes("outfit") ||
      query.includes("fashion")) {
    return "Clothing";
  }
  
  if (query.includes("furniture") || query.includes("chair") || 
      query.includes("table") || query.includes("sofa") || 
      query.includes("desk") || query.includes("couch") ||
      query.includes("bed") || query.includes("mattress") ||
      query.includes("bookshelf") || query.includes("cabinet")) {
    return "Furniture";
  }
  
  if (query.includes("book") || query.includes("novel") || 
      query.includes("reading") || query.includes("textbook") || 
      query.includes("author") || query.includes("fiction") ||
      query.includes("bestseller")) {
    return "Books";
  }
  
  if (query.includes("kitchen") || query.includes("cookware") || 
      query.includes("appliance") || query.includes("utensil") || 
      query.includes("cooking") || query.includes("baking")) {
    return "Kitchen";
  }
  
  if (query.includes("gift") || query.includes("present")) {
    return "Gifts";
  }
  
  if (query.includes("toy") || query.includes("game") || 
      query.includes("kids") || query.includes("children")) {
    return "Toys";
  }
  
  // Default to Electronics as a common category
  return "Electronics";
};

/**
 * Check if a product is relevant to a search query
 */
export const isProductRelevantToSearch = (product: ZincProduct, query: string): boolean => {
  const lowercaseQuery = query.toLowerCase();
  const title = (product.title || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const category = (product.category || "").toLowerCase();
  const description = (product.description || "").toLowerCase();
  
  // Break the query into words for more precise matching
  const queryTerms = lowercaseQuery.split(/\s+/).filter(term => term.length > 2);
  
  // Product must match at least one term in the title, brand, or category
  const hasTermMatch = queryTerms.some(term => 
    title.includes(term) || 
    brand.includes(term) || 
    category.includes(term) || 
    description.includes(term)
  );
  
  return hasTermMatch;
};
