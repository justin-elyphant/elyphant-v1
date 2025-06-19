
/**
 * Multi-category search service for grouped product results
 * Phase 2: Enhanced with parallel search strategy and smart limiting
 */

import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { Product } from "@/contexts/ProductContext";
import { normalizeProduct } from "@/contexts/ProductContext";
import { ParsedContext, generateMultiCategoryQueries } from "./enhancedContextParser";

export interface GroupedSearchResults {
  categories: CategoryResults[];
  totalResults: number;
  searchQueries: string[];
  searchMetrics: SearchMetrics;
}

export interface CategoryResults {
  categoryName: string;
  displayName: string;
  products: Product[];
  searchQuery: string;
  resultCount: number;
  searchTime: number;
  relevanceScore: number;
}

export interface SearchMetrics {
  totalSearchTime: number;
  categoriesSearched: number;
  successfulSearches: number;
  failedSearches: number;
  averageResultsPerCategory: number;
}

// Enhanced brand categories with better search terms
const BRAND_CATEGORIES = {
  // Athletic/Fashion brands
  'lululemon': { 
    category: 'athletic-wear', 
    terms: ['lululemon yoga pants', 'lululemon athletic wear', 'lululemon leggings'],
    priority: 1
  },
  'nike': { 
    category: 'athletic-wear', 
    terms: ['nike sneakers', 'nike running shoes', 'nike sportswear'],
    priority: 1
  },
  'adidas': { 
    category: 'athletic-wear', 
    terms: ['adidas shoes', 'adidas sneakers', 'adidas clothing'],
    priority: 1
  },
  'patagonia': { 
    category: 'outdoor-gear', 
    terms: ['patagonia jacket', 'patagonia outdoor gear', 'patagonia hiking'],
    priority: 1
  },
  
  // Kitchen/Cooking brands
  'vitamix': { 
    category: 'kitchen', 
    terms: ['vitamix blender', 'vitamix professional', 'high performance blender'],
    priority: 1
  },
  'kitchenaid': { 
    category: 'kitchen', 
    terms: ['kitchenaid mixer', 'kitchenaid stand mixer', 'kitchen appliances'],
    priority: 1
  },
  'all-clad': { 
    category: 'kitchen', 
    terms: ['all-clad cookware', 'all-clad pans', 'professional cookware'],
    priority: 1
  },
  'le creuset': { 
    category: 'kitchen', 
    terms: ['le creuset dutch oven', 'le creuset cookware', 'cast iron cookware'],
    priority: 1
  },
  
  // Tech brands
  'apple': { 
    category: 'electronics', 
    terms: ['apple accessories', 'apple airpods', 'apple iphone accessories'],
    priority: 1
  },
  'samsung': { 
    category: 'electronics', 
    terms: ['samsung electronics', 'samsung accessories', 'samsung galaxy'],
    priority: 1
  },
  'sony': { 
    category: 'electronics', 
    terms: ['sony headphones', 'sony electronics', 'sony audio'],
    priority: 1
  },
  
  // Travel brands
  'away': { 
    category: 'travel', 
    terms: ['away luggage', 'away suitcase', 'travel luggage'],
    priority: 1
  },
  'tumi': { 
    category: 'travel', 
    terms: ['tumi luggage', 'tumi travel bag', 'premium luggage'],
    priority: 1
  }
};

// Category display name mapping with better names
const CATEGORY_DISPLAY_NAMES = {
  'kitchen': 'Cooking & Kitchen',
  'athletic-wear': 'Athletic & Fitness',
  'travel': 'Travel Essentials',
  'electronics': 'Tech & Electronics',
  'fitness': 'Health & Wellness',
  'books': 'Books & Reading',
  'art-supplies': 'Art & Creative',
  'outdoor-gear': 'Outdoor & Adventure',
  'beauty': 'Beauty & Personal Care',
  'home': 'Home & Living'
};

/**
 * Enhanced multi-category search with parallel processing
 */
export const performMultiCategorySearch = async (
  parsedContext: ParsedContext,
  maxPerCategory: number = 4
): Promise<GroupedSearchResults> => {
  const startTime = Date.now();
  console.log('🚀 Phase 2 Multi-Category Search: Starting parallel search', parsedContext);
  
  // Generate enhanced queries for parallel processing
  const categoryQueries = generateEnhancedCategoryQueries(parsedContext);
  console.log('📋 Generated enhanced category queries:', categoryQueries);
  
  if (categoryQueries.length === 0) {
    return await performFallbackSearch(parsedContext, maxPerCategory);
  }
  
  // Phase 2: Parallel Search Strategy
  const searchResults = await executeParallelSearches(categoryQueries, maxPerCategory);
  
  // Phase 2: Result Aggregation and Smart Limiting
  const aggregatedResults = aggregateAndLimitResults(searchResults, maxPerCategory);
  
  // Calculate search metrics
  const searchMetrics = calculateSearchMetrics(searchResults, startTime);
  
  const finalResults: GroupedSearchResults = {
    categories: aggregatedResults,
    totalResults: aggregatedResults.reduce((sum, cat) => sum + cat.resultCount, 0),
    searchQueries: categoryQueries.map(q => q.query),
    searchMetrics
  };
  
  console.log('✅ Phase 2 Multi-Category Search Complete:', {
    categories: finalResults.categories.length,
    totalResults: finalResults.totalResults,
    metrics: finalResults.searchMetrics
  });
  
  return finalResults;
};

/**
 * Generate enhanced category queries with better search terms
 */
const generateEnhancedCategoryQueries = (parsedContext: ParsedContext) => {
  const queries: Array<{
    query: string;
    category: string;
    priority: number;
    searchTerms: string[];
  }> = [];
  
  // Enhanced brand-based queries
  parsedContext.detectedBrands.forEach(brand => {
    const brandConfig = BRAND_CATEGORIES[brand.toLowerCase()];
    if (brandConfig) {
      // Use the most specific search term for better results
      const primaryTerm = brandConfig.terms[0];
      let query = primaryTerm;
      
      // Add context enhancement
      if (parsedContext.recipient) {
        query += ` for ${parsedContext.recipient}`;
      }
      if (parsedContext.budget) {
        const [, max] = parsedContext.budget;
        query += ` under $${max}`;
      }
      
      queries.push({
        query: query.trim(),
        category: brandConfig.category,
        priority: brandConfig.priority,
        searchTerms: brandConfig.terms
      });
    }
  });
  
  // Enhanced interest-based queries
  parsedContext.categoryMappings.forEach(mapping => {
    if (!queries.find(q => q.category === mapping.category)) {
      let query = mapping.searchTerms[0];
      
      // Add demographic context
      if (parsedContext.recipient) {
        query += ` for ${parsedContext.recipient}`;
      }
      if (parsedContext.occasion) {
        query += ` ${parsedContext.occasion}`;
      }
      if (parsedContext.budget) {
        const [, max] = parsedContext.budget;
        query += ` under $${max}`;
      }
      
      queries.push({
        query: query.trim(),
        category: mapping.category,
        priority: mapping.priority,
        searchTerms: mapping.searchTerms
      });
    }
  });
  
  // Sort by priority and limit to top 4 categories for optimal performance
  return queries
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);
};

/**
 * Execute parallel searches for all categories
 */
const executeParallelSearches = async (
  categoryQueries: Array<{
    query: string;
    category: string;
    priority: number;
    searchTerms: string[];
  }>,
  maxPerCategory: number
): Promise<Array<{
  categoryName: string;
  searchQuery: string;
  products: Product[];
  searchTime: number;
  success: boolean;
  error?: string;
}>> => {
  console.log('🔄 Executing parallel searches for', categoryQueries.length, 'categories');
  
  // Execute all searches in parallel
  const searchPromises = categoryQueries.map(async ({ query, category }) => {
    const searchStart = Date.now();
    
    try {
      console.log(`🔎 Searching category ${category} with query: "${query}"`);
      const results = await searchProducts(query);
      const searchTime = Date.now() - searchStart;
      
      // Convert and limit results
      const products = results
        .slice(0, maxPerCategory * 2) // Get more results to filter from
        .map((product, index) => 
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
        )
        .slice(0, maxPerCategory); // Final limit
      
      return {
        categoryName: category,
        searchQuery: query,
        products,
        searchTime,
        success: true
      };
    } catch (error) {
      console.error(`❌ Error searching category ${category}:`, error);
      return {
        categoryName: category,
        searchQuery: query,
        products: [],
        searchTime: Date.now() - searchStart,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
  
  // Wait for all searches to complete
  const results = await Promise.all(searchPromises);
  console.log('✅ Parallel searches completed:', results.length, 'results');
  
  return results;
};

/**
 * Aggregate results and apply smart limiting
 */
const aggregateAndLimitResults = (
  searchResults: Array<{
    categoryName: string;
    searchQuery: string;
    products: Product[];
    searchTime: number;
    success: boolean;
    error?: string;
  }>,
  maxPerCategory: number
): CategoryResults[] => {
  console.log('📊 Aggregating and limiting results');
  
  return searchResults
    .filter(result => result.success && result.products.length > 0)
    .map(result => {
      // Calculate relevance score based on multiple factors
      const relevanceScore = calculateRelevanceScore(result);
      
      return {
        categoryName: result.categoryName,
        displayName: CATEGORY_DISPLAY_NAMES[result.categoryName] || 
                     result.categoryName.charAt(0).toUpperCase() + result.categoryName.slice(1),
        products: result.products.slice(0, maxPerCategory), // Smart limiting
        searchQuery: result.searchQuery,
        resultCount: Math.min(result.products.length, maxPerCategory),
        searchTime: result.searchTime,
        relevanceScore
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
    .slice(0, 4); // Limit to top 4 categories to avoid overwhelming users
};

/**
 * Calculate relevance score for search results
 */
const calculateRelevanceScore = (result: {
  products: Product[];
  searchTime: number;
  categoryName: string;
}): number => {
  let score = 0;
  
  // Factor 1: Number of results (more results = higher relevance)
  score += Math.min(result.products.length * 10, 50);
  
  // Factor 2: Search speed (faster = more relevant/cached)
  score += Math.max(20 - (result.searchTime / 100), 0);
  
  // Factor 3: Category priority (some categories are more giftable)
  const priorityCategories = ['kitchen', 'athletic-wear', 'electronics', 'travel'];
  if (priorityCategories.includes(result.categoryName)) {
    score += 20;
  }
  
  // Factor 4: Product quality indicators
  const avgRating = result.products.reduce((sum, p) => sum + (p.rating || 0), 0) / result.products.length;
  score += avgRating * 5;
  
  return score;
};

/**
 * Calculate comprehensive search metrics
 */
const calculateSearchMetrics = (
  searchResults: Array<{
    success: boolean;
    searchTime: number;
    products: Product[];
  }>,
  startTime: number
): SearchMetrics => {
  const totalSearchTime = Date.now() - startTime;
  const successfulSearches = searchResults.filter(r => r.success).length;
  const failedSearches = searchResults.filter(r => !r.success).length;
  const totalResults = searchResults.reduce((sum, r) => sum + r.products.length, 0);
  
  return {
    totalSearchTime,
    categoriesSearched: searchResults.length,
    successfulSearches,
    failedSearches,
    averageResultsPerCategory: successfulSearches > 0 ? totalResults / successfulSearches : 0
  };
};

/**
 * Fallback search when no categories detected
 */
const performFallbackSearch = async (
  parsedContext: ParsedContext,
  maxResults: number
): Promise<GroupedSearchResults> => {
  const startTime = Date.now();
  const fallbackQuery = generateFallbackQuery(parsedContext);
  
  try {
    const results = await searchProducts(fallbackQuery);
    const products = results.slice(0, maxResults).map((product, index) => 
      normalizeProduct({
        id: product.product_id || `general-${index}`,
        product_id: product.product_id || `general-${index}`,
        title: product.title || fallbackQuery,
        name: product.title || fallbackQuery,
        price: product.price || 19.99,
        category: product.category || "General",
        image: product.image || "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: product.description || `${fallbackQuery} product`,
        rating: product.rating || 4.0,
        reviewCount: product.review_count || 50
      })
    );
    
    return {
      categories: [{
        categoryName: 'general',
        displayName: 'Gift Ideas',
        products,
        searchQuery: fallbackQuery,
        resultCount: products.length,
        searchTime: Date.now() - startTime,
        relevanceScore: 50
      }],
      totalResults: products.length,
      searchQueries: [fallbackQuery],
      searchMetrics: {
        totalSearchTime: Date.now() - startTime,
        categoriesSearched: 1,
        successfulSearches: 1,
        failedSearches: 0,
        averageResultsPerCategory: products.length
      }
    };
  } catch (error) {
    console.error('❌ Error in fallback search:', error);
    return {
      categories: [],
      totalResults: 0,
      searchQueries: [fallbackQuery],
      searchMetrics: {
        totalSearchTime: Date.now() - startTime,
        categoriesSearched: 1,
        successfulSearches: 0,
        failedSearches: 1,
        averageResultsPerCategory: 0
      }
    };
  }
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
