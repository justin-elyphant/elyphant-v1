
/**
 * Multi-category search service for grouped product results
 */

import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { Product } from "@/contexts/ProductContext";
import { normalizeProduct } from "@/contexts/ProductContext";
import { ParsedContext, generateMultiCategoryQueries } from "./enhancedContextParser";

export interface GroupedSearchResults {
  categories: CategoryResults[];
  totalResults: number;
  searchQueries: string[];
}

export interface CategoryResults {
  categoryName: string;
  displayName: string;
  products: Product[];
  searchQuery: string;
  resultCount: number;
}

// Category display name mapping
const CATEGORY_DISPLAY_NAMES = {
  'kitchen': 'Cooking Essentials',
  'athletic-wear': 'Athletic & Fitness',
  'travel': 'Travel Gear',
  'electronics': 'Electronics & Tech',
  'fitness': 'Fitness & Wellness',
  'books': 'Books & Reading',
  'art-supplies': 'Art & Creative',
  'outdoor-gear': 'Outdoor & Adventure'
};

/**
 * Perform multi-category search based on parsed context
 */
export const performMultiCategorySearch = async (
  parsedContext: ParsedContext,
  maxPerCategory: number = 4
): Promise<GroupedSearchResults> => {
  console.log('🔍 Multi-Category Search: Starting with context', parsedContext);
  
  // Generate targeted queries for each category
  const categoryQueries = generateMultiCategoryQueries(parsedContext);
  console.log('📋 Generated category queries:', categoryQueries);
  
  if (categoryQueries.length === 0) {
    // Fallback to single general search
    const fallbackQuery = generateFallbackQuery(parsedContext);
    return await performSingleSearch(fallbackQuery, maxPerCategory);
  }
  
  // Perform parallel searches for each category
  const searchPromises = categoryQueries.map(async ({ query, category, priority }) => {
    try {
      console.log(`🔎 Searching category ${category} with query: "${query}"`);
      const results = await searchProducts(query);
      
      // Convert to Product format
      const products = results.slice(0, maxPerCategory).map((product, index) => 
        normalizeProduct({
          id: product.product_id || `${category}-${index}`,
          product_id: product.product_id || `${category}-${index}`,
          title: product.title || query,
          name: product.title || query,
          price: product.price || 19.99,
          category: product.category || category,
          image: product.image || "/placeholder.svg",
          vendor: "Amazon via Zinc",
          description: product.description || `${query} product`,
          rating: product.rating || 4.0,
          reviewCount: product.review_count || 50
        })
      );
      
      return {
        categoryName: category,
        displayName: CATEGORY_DISPLAY_NAMES[category] || category.charAt(0).toUpperCase() + category.slice(1),
        products,
        searchQuery: query,
        resultCount: products.length
      };
    } catch (error) {
      console.error(`❌ Error searching category ${category}:`, error);
      return {
        categoryName: category,
        displayName: CATEGORY_DISPLAY_NAMES[category] || category.charAt(0).toUpperCase() + category.slice(1),
        products: [],
        searchQuery: query,
        resultCount: 0
      };
    }
  });
  
  // Wait for all searches to complete
  const categoryResults = await Promise.all(searchPromises);
  
  // Filter out empty categories
  const validCategories = categoryResults.filter(cat => cat.products.length > 0);
  
  const totalResults = validCategories.reduce((sum, cat) => sum + cat.resultCount, 0);
  const searchQueries = categoryQueries.map(q => q.query);
  
  console.log('✅ Multi-Category Search Complete:', {
    categories: validCategories.length,
    totalResults,
    searchQueries
  });
  
  return {
    categories: validCategories,
    totalResults,
    searchQueries
  };
};

/**
 * Generate fallback query when no specific categories detected
 */
const generateFallbackQuery = (parsedContext: ParsedContext): string => {
  let query = "gifts";
  
  if (parsedContext.recipient) {
    query += ` for ${parsedContext.recipient}`;
  } else if (parsedContext.relationship) {
    query += ` for ${parsedContext.relationship}`;
  }
  
  if (parsedContext.occasion) {
    query += ` ${parsedContext.occasion}`;
  }
  
  if (parsedContext.budget) {
    const [, max] = parsedContext.budget;
    query += ` under $${max}`;
  }
  
  return query.trim();
};

/**
 * Perform single search as fallback
 */
const performSingleSearch = async (
  query: string,
  maxResults: number
): Promise<GroupedSearchResults> => {
  try {
    const results = await searchProducts(query);
    const products = results.slice(0, maxResults).map((product, index) => 
      normalizeProduct({
        id: product.product_id || `general-${index}`,
        product_id: product.product_id || `general-${index}`,
        title: product.title || query,
        name: product.title || query,
        price: product.price || 19.99,
        category: product.category || "General",
        image: product.image || "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: product.description || `${query} product`,
        rating: product.rating || 4.0,
        reviewCount: product.review_count || 50
      })
    );
    
    return {
      categories: [{
        categoryName: 'general',
        displayName: 'Gift Ideas',
        products,
        searchQuery: query,
        resultCount: products.length
      }],
      totalResults: products.length,
      searchQueries: [query]
    };
  } catch (error) {
    console.error('❌ Error in fallback search:', error);
    return {
      categories: [],
      totalResults: 0,
      searchQueries: [query]
    };
  }
};
