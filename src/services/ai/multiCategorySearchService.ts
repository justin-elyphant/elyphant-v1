import { searchMockProducts } from "@/components/marketplace/services/mockProductService";
import { Product } from "@/contexts/ProductContext";
import { ParsedContext, generateMultiCategoryQueries } from "./enhancedContextParser";

export interface CategoryResults {
  categoryName: string;
  displayName: string;
  searchQuery: string;
  products: Product[];
  resultCount: number;
  searchTime?: number;
  relevanceScore?: number;
}

export interface GroupedSearchResults {
  categories: CategoryResults[];
  totalResults: number;
  searchMetrics?: {
    totalSearchTime: number;
    successfulSearches: number;
    failedSearches: number;
  };
}

export interface SearchMetrics {
  startTime: number;
  endTime: number;
  totalSearchTime: number;
  successfulSearches: number;
  failedSearches: number;
}

/**
 * Enhanced multi-category search with parallel execution and smart limiting
 */
export async function performMultiCategorySearch(
  parsedContext: ParsedContext,
  itemsPerCategory: number = 4
): Promise<GroupedSearchResults> {
  console.log('🔍 Starting enhanced multi-category search with context:', parsedContext);
  
  const searchMetrics: SearchMetrics = {
    startTime: Date.now(),
    endTime: 0,
    totalSearchTime: 0,
    successfulSearches: 0,
    failedSearches: 0
  };

  try {
    // Generate targeted search queries from parsed context
    const searchQueries = generateMultiCategoryQueries(parsedContext);
    console.log('📋 Generated search queries:', searchQueries);

    if (searchQueries.length === 0) {
      console.log('⚠️ No search queries generated from context');
      return {
        categories: [],
        totalResults: 0,
        searchMetrics: {
          totalSearchTime: 0,
          successfulSearches: 0,
          failedSearches: 0
        }
      };
    }

    // Execute parallel searches with enhanced error handling
    const searchPromises = searchQueries.map(async (queryConfig) => {
      const searchStartTime = Date.now();
      
      try {
        console.log(`🔍 Executing search for category: ${queryConfig.category}, query: "${queryConfig.query}"`);
        
        // Use existing mock product search with enhanced limiting
        const searchResults = searchMockProducts(queryConfig.query, itemsPerCategory * 2); // Get more results for better filtering
        
        // Smart limiting: Take top results based on relevance
        const limitedResults = searchResults.slice(0, itemsPerCategory);
        
        const searchTime = Date.now() - searchStartTime;
        searchMetrics.successfulSearches++;
        
        console.log(`✅ Search completed for ${queryConfig.category}: ${limitedResults.length} results in ${searchTime}ms`);
        
        // Generate enhanced display name
        const displayName = generateCategoryDisplayName(queryConfig.category, queryConfig.query, parsedContext);
        
        return {
          categoryName: queryConfig.category,
          displayName,
          searchQuery: queryConfig.query,
          products: limitedResults,
          resultCount: limitedResults.length,
          searchTime,
          relevanceScore: calculateRelevanceScore(queryConfig, parsedContext)
        } as CategoryResults;
        
      } catch (error) {
        console.error(`❌ Search failed for category ${queryConfig.category}:`, error);
        searchMetrics.failedSearches++;
        return null;
      }
    });

    // Wait for all searches to complete
    const searchResults = await Promise.all(searchPromises);
    
    // Filter out failed searches and sort by relevance
    const validResults = searchResults
      .filter((result): result is CategoryResults => result !== null)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    searchMetrics.endTime = Date.now();
    searchMetrics.totalSearchTime = searchMetrics.endTime - searchMetrics.startTime;

    const totalResults = validResults.reduce((sum, category) => sum + category.resultCount, 0);

    console.log('🎯 Multi-category search completed:', {
      categoriesFound: validResults.length,
      totalResults,
      searchTime: searchMetrics.totalSearchTime,
      successfulSearches: searchMetrics.successfulSearches,
      failedSearches: searchMetrics.failedSearches
    });

    return {
      categories: validResults,
      totalResults,
      searchMetrics: {
        totalSearchTime: searchMetrics.totalSearchTime,
        successfulSearches: searchMetrics.successfulSearches,
        failedSearches: searchMetrics.failedSearches
      }
    };

  } catch (error) {
    console.error('💥 Multi-category search failed:', error);
    searchMetrics.endTime = Date.now();
    searchMetrics.totalSearchTime = searchMetrics.endTime - searchMetrics.startTime;
    
    return {
      categories: [],
      totalResults: 0,
      searchMetrics: {
        totalSearchTime: searchMetrics.totalSearchTime,
        successfulSearches: searchMetrics.successfulSearches,
        failedSearches: searchMetrics.failedSearches + 1
      }
    };
  }
}

/**
 * Generate enhanced category display names for better UX
 */
function generateCategoryDisplayName(
  categoryName: string, 
  searchQuery: string, 
  context: ParsedContext
): string {
  // Brand-first naming
  if (context.detectedBrands.length > 0) {
    const primaryBrand = context.detectedBrands[0];
    const brandDisplayNames: Record<string, string> = {
      'lululemon': 'Lululemon Collection',
      'nike': 'Nike Essentials',
      'apple': 'Apple Products',
      'samsung': 'Samsung Devices',
      'vitamix': 'Vitamix Kitchen',
      'kitchenaid': 'KitchenAid Collection',
      'patagonia': 'Patagonia Gear',
      'away': 'Away Travel',
      'tumi': 'Tumi Luggage'
    };
    
    if (brandDisplayNames[primaryBrand.toLowerCase()]) {
      return brandDisplayNames[primaryBrand.toLowerCase()];
    }
  }

  // Category-based naming with context awareness
  const categoryDisplayNames: Record<string, string> = {
    'kitchen': 'Cooking Essentials',
    'athletic-wear': context.recipient ? `Athletic Wear for ${context.recipient}` : 'Athletic Favorites',
    'fitness': context.recipient ? `Fitness Gear for ${context.recipient}` : 'Fitness Equipment',
    'travel': context.occasion ? `Travel Gear for ${context.occasion}` : 'Travel Essentials',
    'electronics': 'Tech & Electronics',
    'books': 'Books & Reading',
    'art-supplies': 'Art & Creative Supplies',
    'outdoor-gear': 'Outdoor Adventures'
  };

  return categoryDisplayNames[categoryName] || toTitleCase(categoryName.replace('-', ' '));
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(
  queryConfig: { category: string; priority: number; query: string },
  context: ParsedContext
): number {
  let score = queryConfig.priority * 20; // Base score from priority

  // Boost score for brand matches
  if (context.detectedBrands.some(brand => 
    queryConfig.query.toLowerCase().includes(brand.toLowerCase())
  )) {
    score += 30;
  }

  // Boost score for interest matches
  if (context.interests.some(interest => 
    queryConfig.query.toLowerCase().includes(interest.toLowerCase())
  )) {
    score += 25;
  }

  // Boost score for recipient context
  if (context.recipient && queryConfig.query.toLowerCase().includes('for')) {
    score += 15;
  }

  // Boost score for occasion context
  if (context.occasion && queryConfig.query.toLowerCase().includes(context.occasion.toLowerCase())) {
    score += 20;
  }

  return Math.min(score, 100); // Cap at 100%
}

/**
 * Utility function to convert strings to title case
 */
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
