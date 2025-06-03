
/**
 * Optimized Zinc service with caching and cost controls
 */

import { searchCache } from "../cache/searchCache";
import { searchDebouncer } from "./searchDebouncer";
import { searchZincProducts as originalZincSearch } from "../api/zincApiService";

// Popular search terms that should use mock data first
const POPULAR_MOCK_TERMS = [
  'gift', 'birthday', 'christmas', 'valentine', 'anniversary', 
  'headphones', 'phone', 'laptop', 'watch', 'jewelry',
  'book', 'game', 'toy', 'clothing', 'shoes'
];

// Query expansion for better cache hits
const QUERY_EXPANSIONS: Record<string, string[]> = {
  'phone': ['smartphone', 'mobile phone', 'iphone', 'android'],
  'laptop': ['computer', 'notebook', 'macbook'],
  'headphones': ['earbuds', 'earphones', 'audio'],
  'watch': ['smartwatch', 'timepiece', 'wearable'],
  'gift': ['present', 'surprise'],
};

class OptimizedZincService {
  private monthlyBudget = 50; // $50 monthly budget
  private currentMonthSpent = 0;
  private readonly COST_PER_CALL = 0.10;

  /**
   * Check if we're within budget for API calls
   */
  private canMakeApiCall(): boolean {
    return (this.currentMonthSpent + this.COST_PER_CALL) <= this.monthlyBudget;
  }

  /**
   * Expand query to find similar cached results
   */
  private expandQuery(query: string): string[] {
    const normalizedQuery = query.toLowerCase();
    const expansions = [query];

    // Add expansions from our mapping
    for (const [key, values] of Object.entries(QUERY_EXPANSIONS)) {
      if (normalizedQuery.includes(key)) {
        expansions.push(...values);
      }
    }

    return expansions;
  }

  /**
   * Check if query should use mock data first
   */
  private shouldUseMockFirst(query: string): boolean {
    const normalizedQuery = query.toLowerCase();
    return POPULAR_MOCK_TERMS.some(term => normalizedQuery.includes(term));
  }

  /**
   * Optimized search with multiple cost-saving strategies
   */
  public async optimizedSearch(query: string, maxResults: number = 10): Promise<any[]> {
    console.log(`OptimizedZincService: Processing search for "${query}"`);

    // Strategy 1: Check cache first (including fuzzy matching)
    const expandedQueries = this.expandQuery(query);
    for (const expandedQuery of expandedQueries) {
      const cachedResults = searchCache.get(expandedQuery);
      if (cachedResults) {
        console.log(`Using cached results for "${query}" (via "${expandedQuery}")`);
        return cachedResults.slice(0, maxResults);
      }
    }

    // Strategy 2: Use debounced search to combine similar requests
    return searchDebouncer.debouncedSearch(query, async (debouncedQuery) => {
      // Strategy 3: Check budget before making API call
      if (!this.canMakeApiCall()) {
        console.log(`Budget limit reached. Using mock data for "${debouncedQuery}"`);
        return this.getMockResults(debouncedQuery, maxResults);
      }

      // Strategy 4: For popular terms, try mock data first
      if (this.shouldUseMockFirst(debouncedQuery)) {
        console.log(`Using mock data first for popular term: "${debouncedQuery}"`);
        const mockResults = this.getMockResults(debouncedQuery, maxResults);
        if (mockResults.length >= Math.min(5, maxResults)) {
          // Cache the mock results
          searchCache.set(debouncedQuery, mockResults);
          return mockResults;
        }
      }

      try {
        console.log(`Making API call to Zinc for: "${debouncedQuery}"`);
        this.currentMonthSpent += this.COST_PER_CALL;
        
        const apiResponse = await originalZincSearch(debouncedQuery, maxResults);
        
        if (apiResponse.results && apiResponse.results.length > 0) {
          // Cache successful API results
          searchCache.set(debouncedQuery, apiResponse.results);
          console.log(`API call successful. Cached ${apiResponse.results.length} results for "${debouncedQuery}"`);
          return apiResponse.results;
        } else {
          // API returned no results, use mock data as fallback
          console.log(`API returned no results for "${debouncedQuery}". Using mock fallback.`);
          const fallbackResults = this.getMockResults(debouncedQuery, maxResults);
          searchCache.set(debouncedQuery, fallbackResults);
          return fallbackResults;
        }
      } catch (error) {
        console.error(`API call failed for "${debouncedQuery}":`, error);
        // Use mock data as fallback for API errors
        const fallbackResults = this.getMockResults(debouncedQuery, maxResults);
        searchCache.set(debouncedQuery, fallbackResults);
        return fallbackResults;
      }
    });
  }

  /**
   * Get mock results for fallback
   */
  private getMockResults(query: string, maxResults: number): any[] {
    // Import and use existing mock search functionality
    try {
      const { searchMockProducts } = require('../../components/marketplace/services/mockProductService');
      return searchMockProducts(query, maxResults);
    } catch {
      return [];
    }
  }

  /**
   * Get service statistics
   */
  public getStats() {
    const cacheStats = searchCache.getStats();
    const debounceStats = searchDebouncer.getStats();
    
    return {
      budget: {
        monthly: this.monthlyBudget,
        spent: this.currentMonthSpent,
        remaining: this.monthlyBudget - this.currentMonthSpent,
        percentUsed: ((this.currentMonthSpent / this.monthlyBudget) * 100).toFixed(1) + '%'
      },
      cache: cacheStats,
      debouncing: debounceStats,
      optimization: {
        totalApiCallsSaved: cacheStats.apiCallsSaved,
        totalCostSaved: `$${cacheStats.costSaved.toFixed(2)}`,
        estimatedMonthlySavings: `$${(cacheStats.costSaved * 30).toFixed(2)}`
      }
    };
  }

  /**
   * Reset monthly budget tracking
   */
  public resetMonthlyTracking() {
    this.currentMonthSpent = 0;
    console.log('Monthly budget tracking reset');
  }

  /**
   * Set monthly budget
   */
  public setMonthlyBudget(budget: number) {
    this.monthlyBudget = budget;
    console.log(`Monthly budget set to $${budget}`);
  }
}

export const optimizedZincService = new OptimizedZincService();
