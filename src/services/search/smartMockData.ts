
/**
 * Smart mock data system that learns from user behavior
 */

interface PopularityData {
  query: string;
  count: number;
  lastSearched: number;
  successRate: number; // How often this query finds good results
}

class SmartMockDataService {
  private readonly STORAGE_KEY = 'smart_mock_popularity';
  private popularityData = new Map<string, PopularityData>();
  private initialized = false;

  constructor() {
    this.loadPopularityData();
  }

  private loadPopularityData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.popularityData = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load popularity data:', error);
    }
    this.initialized = true;
  }

  private savePopularityData() {
    try {
      const data = Object.fromEntries(this.popularityData);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save popularity data:', error);
    }
  }

  /**
   * Record a search query and its success
   */
  public recordSearch(query: string, foundResults: boolean, resultCount: number = 0) {
    if (!this.initialized) return;

    const normalizedQuery = query.toLowerCase().trim();
    const existing = this.popularityData.get(normalizedQuery);

    if (existing) {
      existing.count += 1;
      existing.lastSearched = Date.now();
      // Update success rate with exponential moving average
      const newSuccess = foundResults && resultCount > 0 ? 1 : 0;
      existing.successRate = 0.8 * existing.successRate + 0.2 * newSuccess;
    } else {
      this.popularityData.set(normalizedQuery, {
        query: normalizedQuery,
        count: 1,
        lastSearched: Date.now(),
        successRate: foundResults && resultCount > 0 ? 1 : 0
      });
    }

    // Save periodically to avoid too frequent writes
    if (Math.random() < 0.1) {
      this.savePopularityData();
    }
  }

  /**
   * Get the most popular queries for prewarming cache
   */
  public getPopularQueries(limit: number = 20): string[] {
    const week = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    return Array.from(this.popularityData.values())
      .filter(data => (now - data.lastSearched) < week) // Only recent queries
      .sort((a, b) => {
        // Sort by combination of popularity and success rate
        const scoreA = a.count * a.successRate;
        const scoreB = b.count * b.successRate;
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(data => data.query);
  }

  /**
   * Check if a query is likely to be successful based on history
   */
  public isProbablySuccessful(query: string): boolean {
    const normalizedQuery = query.toLowerCase().trim();
    const data = this.popularityData.get(normalizedQuery);
    
    if (!data) return true; // Unknown queries get the benefit of the doubt
    
    return data.successRate > 0.5; // 50% success threshold
  }

  /**
   * Get enhanced mock data for popular queries
   */
  public getEnhancedMockData(query: string, baseResults: any[]): any[] {
    const normalizedQuery = query.toLowerCase().trim();
    const data = this.popularityData.get(normalizedQuery);

    if (!data || data.successRate < 0.7) {
      return baseResults;
    }

    // For high-success queries, enhance the mock data
    return baseResults.map((result, index) => ({
      ...result,
      // Boost ratings for popular successful queries
      rating: Math.min(5, (result.rating || 4) + 0.3),
      // Add "Popular Choice" badge for top results
      badges: index < 3 ? ['Popular Choice'] : [],
      // Slightly randomize prices to seem more realistic
      price: result.price * (0.95 + Math.random() * 0.1)
    }));
  }

  /**
   * Get analytics about search patterns
   */
  public getAnalytics() {
    const totalSearches = Array.from(this.popularityData.values())
      .reduce((sum, data) => sum + data.count, 0);
    
    const averageSuccessRate = Array.from(this.popularityData.values())
      .reduce((sum, data) => sum + data.successRate, 0) / this.popularityData.size;

    const topQueries = this.getPopularQueries(10);

    return {
      totalUniqueQueries: this.popularityData.size,
      totalSearches,
      averageSuccessRate: averageSuccessRate.toFixed(2),
      topQueries,
      recentActivity: Array.from(this.popularityData.values())
        .filter(data => Date.now() - data.lastSearched < 24 * 60 * 60 * 1000)
        .length
    };
  }

  /**
   * Clear old data to prevent storage bloat
   */
  public cleanup() {
    const month = 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - month;

    for (const [query, data] of this.popularityData.entries()) {
      if (data.lastSearched < cutoff) {
        this.popularityData.delete(query);
      }
    }

    this.savePopularityData();
    console.log(`Cleaned up old search data. Remaining queries: ${this.popularityData.size}`);
  }
}

export const smartMockDataService = new SmartMockDataService();
