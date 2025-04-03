
import { ZincProduct } from '../types';
import { allProducts, specificProducts } from '../data/mockProducts';
import { createMockResults } from './mockResultsGenerator';
import { guessCategory } from './categoryUtils';

/**
 * Maps search terms to appropriate image categories to ensure correct images
 */
const getImageCategory = (query: string): string => {
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Technology brands mapping
  if (lowercaseQuery.includes('apple') || 
      lowercaseQuery.includes('iphone') || 
      lowercaseQuery.includes('macbook') || 
      lowercaseQuery.includes('ipad') || 
      lowercaseQuery.includes('airpods')) {
    return 'Apple';
  }
  
  if (lowercaseQuery.includes('samsung') || 
      lowercaseQuery.includes('galaxy')) {
    return 'Samsung';
  }
  
  if (lowercaseQuery.includes('sony') || 
      lowercaseQuery.includes('playstation')) {
    return 'Electronics';
  }
  
  // Footwear brands mapping
  if (lowercaseQuery.includes('nike') || 
      lowercaseQuery.includes('shoes') || 
      lowercaseQuery.includes('sneakers') ||
      lowercaseQuery.includes('footwear')) {
    return 'Footwear';
  }
  
  if (lowercaseQuery.includes('xbox') || 
      lowercaseQuery.includes('playstation') || 
      lowercaseQuery.includes('gaming')) {
    return 'Gaming';
  }
  
  if (lowercaseQuery.includes('dallas') || 
      lowercaseQuery.includes('cowboys')) {
    return 'Sports';
  }
  
  // Default to the guessed category
  return guessCategory(lowercaseQuery);
};

/**
 * Finds products that match the search query with support for misspelled terms
 */
export const findMatchingProducts = (query: string): ZincProduct[] => {
  const lowercaseQuery = query.toLowerCase();
  
  // Normalize query - support both "Nike Shoes" and "nike shoes"
  const normalizedQuery = lowercaseQuery.trim();
  
  console.log(`SearchUtils: Searching for "${normalizedQuery}"`);
  
  // Handle common misspellings
  const correctedQuery = correctMisspellings(normalizedQuery);
  if (correctedQuery !== normalizedQuery) {
    console.log(`SearchUtils: Corrected "${normalizedQuery}" to "${correctedQuery}"`);
  }
  
  // Get appropriate image category
  const imageCategory = getImageCategory(correctedQuery);
  console.log(`SearchUtils: Using image category "${imageCategory}" for "${correctedQuery}"`);
  
  // Direct matching for common searches
  if (correctedQuery === "nike shoes" || 
      correctedQuery === "nike shoe" || 
      (correctedQuery.includes("nike") && correctedQuery.includes("shoe"))) {
    console.log(`SearchUtils: Found special match for Nike Shoes`);
    // Return more products (minimum 100)
    return createMockResults("Nike Shoes", "Footwear", 100);
  }
  
  // Apple products special handling
  if (correctedQuery.includes("apple") || 
      correctedQuery.includes("iphone") || 
      correctedQuery.includes("macbook") || 
      correctedQuery.includes("ipad")) {
    console.log(`SearchUtils: Found special match for Apple products`);
    return createMockResults("Apple Products", "Apple", 100, 4.2, 5.0, "Apple");
  }
  
  // Check for well-known brands and products
  const wellKnownTerms: Record<string, string> = {
    "dallas": "dallas cowboys",
    "cowboys": "dallas cowboys",
    "iphone": "apple iphone",
    "samsung": "samsung galaxy",
    "playstation": "sony playstation",
    "xbox": "microsoft xbox",
    "adidas": "adidas shoes",
    "puma": "puma shoes",
    "nike": "nike shoes"
  };
  
  // Check if query includes any of our well-known terms
  for (const term in wellKnownTerms) {
    if (correctedQuery.includes(term)) {
      const mappedTerm = wellKnownTerms[term];
      console.log(`SearchUtils: Mapping "${term}" to "${mappedTerm}"`);
      
      // If we have specific products for this term, return them
      if (specificProducts[mappedTerm]) {
        // For Nike, always create a larger set of results
        if (term === "nike") {
          return createMockResults("Nike Products", "Nike", 100, 4.0, 5.0, "Nike");
        }
        return specificProducts[mappedTerm];
      }
      
      // If not, let's create some fallback results for common searches
      if (mappedTerm === "dallas cowboys") {
        return createMockResults(mappedTerm, "Sports", 100, 4.3, 5.0, "Sports");
      } else if (mappedTerm.includes("shoes")) {
        return createMockResults(mappedTerm, "Footwear", 100, 4.1, 5.0, mappedTerm.split(' ')[0]);
      } else if (mappedTerm.includes("samsung") || mappedTerm.includes("iphone")) {
        return createMockResults(mappedTerm, mappedTerm.includes("samsung") ? "Samsung" : "Apple", 100, 4.4, 5.0, mappedTerm.split(' ')[0]);
      } else if (mappedTerm.includes("xbox") || mappedTerm.includes("playstation")) {
        return createMockResults(mappedTerm, "Gaming", 100, 4.7, 5.0, mappedTerm.split(' ')[0]);
      }
    }
  }
  
  // Generic search - always return at least 100 items
  return createMockResults(correctedQuery, imageCategory, 100, 3.5, 5.0);
};

/**
 * Corrects common misspellings in search queries
 */
const correctMisspellings = (query: string): string => {
  // Common brand name misspellings
  const misspellings: Record<string, string> = {
    // Apple variants
    "aple": "apple",
    "appl": "apple",
    "appel": "apple",
    "apppe": "apple",
    
    // iPhone variants
    "ifone": "iphone",
    "ipone": "iphone",
    "iphne": "iphone",
    "iphon": "iphone",
    
    // Samsung variants
    "samsng": "samsung",
    "samsun": "samsung",
    "sansung": "samsung",
    "samson": "samsung",
    
    // Nike variants
    "nkie": "nike",
    "nikey": "nike",
    "nik": "nike",
    
    // Other common brands
    "guci": "gucci",
    "adiddas": "adidas",
    "addidas": "adidas",
    "adids": "adidas",
    "amazn": "amazon",
    "mikrosoft": "microsoft",
    "microsfot": "microsoft",
    "sonny": "sony"
  };
  
  // Split query into words and check each one
  const words = query.split(' ');
  const correctedWords = words.map(word => {
    // Check if this word is a known misspelling
    return misspellings[word] || word;
  });
  
  return correctedWords.join(' ');
};
