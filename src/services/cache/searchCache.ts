
/**
 * Advanced search cache system to reduce Zinc API calls
 */

export interface CachedSearchResult {
  query: string;
  results: any[];
  timestamp: number;
  hits: number;
  popularityScore: number;
}

export interface SearchCacheStats {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  apiCallsSaved: number;
  costSaved: number; // Estimated cost saved in dollars
}

class AdvancedSearchCache {
  private cache = new Map<string, CachedSearchResult>();
  private readonly CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly FUZZY_THRESHOLD = 0.8;
  private readonly API_COST_PER_CALL = 0.10; // $0.10 per API call
  
  private stats: SearchCacheStats = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCallsSaved: 0,
    costSaved: 0
  };

  /**
   * Normalize search query for better cache matching
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2;
    if (len2 === 0) return len1;
    
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1, // deletion
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return 1 - (matrix[len2][len1] / maxLen);
  }

  /**
   * Find cached results using fuzzy matching
   */
  private findSimilarCachedQuery(query: string): CachedSearchResult | null {
    const normalizedQuery = this.normalizeQuery(query);
    let bestMatch: CachedSearchResult | null = null;
    let bestSimilarity = 0;

    for (const [cachedQuery, result] of this.cache.entries()) {
      const similarity = this.calculateSimilarity(normalizedQuery, this.normalizeQuery(cachedQuery));
      
      if (similarity >= this.FUZZY_THRESHOLD && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = result;
      }
    }

    return bestMatch;
  }

  /**
   * Check if cached result is still valid
   */
  private isValidCache(result: CachedSearchResult): boolean {
    return Date.now() - result.timestamp < this.CACHE_EXPIRY;
  }

  /**
   * Get cached search results
   */
  public get(query: string): any[] | null {
    this.stats.totalQueries++;
    
    const normalizedQuery = this.normalizeQuery(query);
    
    // Try exact match first
    const exactMatch = this.cache.get(normalizedQuery);
    if (exactMatch && this.isValidCache(exactMatch)) {
      exactMatch.hits++;
      exactMatch.popularityScore += 1;
      this.stats.cacheHits++;
      this.stats.apiCallsSaved++;
      this.stats.costSaved += this.API_COST_PER_CALL;
      
      console.log(`Cache HIT (exact): "${query}" - saved $${this.API_COST_PER_CALL}`);
      return exactMatch.results;
    }

    // Try fuzzy matching
    const fuzzyMatch = this.findSimilarCachedQuery(query);
    if (fuzzyMatch && this.isValidCache(fuzzyMatch)) {
      fuzzyMatch.hits++;
      fuzzyMatch.popularityScore += 0.5; // Lower score for fuzzy matches
      this.stats.cacheHits++;
      this.stats.apiCallsSaved++;
      this.stats.costSaved += this.API_COST_PER_CALL;
      
      console.log(`Cache HIT (fuzzy): "${query}" - saved $${this.API_COST_PER_CALL}`);
      return fuzzyMatch.results;
    }

    this.stats.cacheMisses++;
    console.log(`Cache MISS: "${query}" - API call required`);
    return null;
  }

  /**
   * Store search results in cache
   */
  public set(query: string, results: any[]): void {
    const normalizedQuery = this.normalizeQuery(query);
    
    // Clean up cache if it's getting too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    const cacheEntry: CachedSearchResult = {
      query: normalizedQuery,
      results,
      timestamp: Date.now(),
      hits: 0,
      popularityScore: 1
    };

    this.cache.set(normalizedQuery, cacheEntry);
    console.log(`Cached results for: "${query}" (${results.length} items)`);
  }

  /**
   * Remove expired and least popular entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    const validEntries = entries.filter(([_, result]) => 
      now - result.timestamp < this.CACHE_EXPIRY
    );

    // Sort by popularity score (ascending) and remove least popular
    validEntries.sort((a, b) => a[1].popularityScore - b[1].popularityScore);
    
    const entriesToKeep = validEntries.slice(-Math.floor(this.MAX_CACHE_SIZE * 0.8));
    
    this.cache.clear();
    entriesToKeep.forEach(([key, value]) => {
      this.cache.set(key, value);
    });

    console.log(`Cache cleanup completed. Entries: ${this.cache.size}`);
  }

  /**
   * Get cache statistics
   */
  public getStats(): SearchCacheStats {
    return { ...this.stats };
  }

  /**
   * Get popular queries for prewarming
   */
  public getPopularQueries(limit: number = 10): string[] {
    const entries = Array.from(this.cache.values());
    return entries
      .filter(entry => this.isValidCache(entry))
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit)
      .map(entry => entry.query);
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    console.log('Search cache cleared');
  }

  /**
   * Get cache size info
   */
  public getCacheInfo() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: this.stats.totalQueries > 0 ? 
        (this.stats.cacheHits / this.stats.totalQueries * 100).toFixed(2) + '%' : '0%',
      totalSaved: `$${this.stats.costSaved.toFixed(2)}`
    };
  }
}

// Export singleton instance
export const searchCache = new AdvancedSearchCache();
