
/**
 * Mock data generator for product search results
 */

import { ZincProduct } from '../../types';
import { getImageCategory } from '../categoryMapper';

/**
 * Simple utility to capitalize the first letter of a string
 */
export const capitalizeFirstLetter = (string: string): string => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Generate an image URL for a product based on the search query and category
 */
export const getImageUrl = (query: string, category: string): string => {
  // Simple placeholder image
  return `/placeholder.svg`;
};

/**
 * Create mock results for a search query
 */
export const createMockResults = (
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
      retailer: "Amazon" // Required retailer property
    };
    
    results.push(result);
  }
  
  return results;
};

/**
 * Generate customized mock results for specific search cases
 * @param term The search term
 * @param specificity How specific the results should be (1-10)
 * @param count Number of results to generate
 * @returns An array of mock product results
 */
export const generateSpecialCaseResults = (
  term: string,
  specificity: number = 5,
  count: number = 10
): ZincProduct[] => {
  // Detect if this is a special case search
  const lowerTerm = term.toLowerCase();
  
  // Special case for San Diego Padres hats
  if ((lowerTerm.includes("padres") || lowerTerm.includes("san diego")) && 
      (lowerTerm.includes("hat") || lowerTerm.includes("cap"))) {
    
    return createMockResults(
      "san diego padres baseball hat",
      "Baseball Team Merchandise",
      count,
      4.0,
      5.0,
      "San Diego Padres",
      true
    );
  }
  
  // Could add more special cases here
  
  // Default case - use the category mapper to get appropriate category
  const category = getImageCategory(lowerTerm);
  return createMockResults(term, category, count);
};
