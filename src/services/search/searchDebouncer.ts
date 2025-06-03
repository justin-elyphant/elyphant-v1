
/**
 * Search debouncer to prevent rapid API calls
 */

interface PendingSearch {
  query: string;
  resolve: (results: any[]) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

class SearchDebouncer {
  private pendingSearches = new Map<string, PendingSearch[]>();
  private searchTimers = new Map<string, NodeJS.Timeout>();
  private readonly DEBOUNCE_DELAY = 300; // 300ms debounce
  private readonly DEDUPLICATION_WINDOW = 5000; // 5 seconds
  private recentSearches = new Set<string>();

  /**
   * Debounce search requests to prevent rapid API calls
   */
  public async debouncedSearch(
    query: string,
    searchFunction: (query: string) => Promise<any[]>
  ): Promise<any[]> {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check for duplicate recent searches
    if (this.recentSearches.has(normalizedQuery)) {
      console.log(`Duplicate search blocked: "${query}"`);
      return [];
    }

    return new Promise((resolve, reject) => {
      // Clear existing timer for this query
      const existingTimer = this.searchTimers.get(normalizedQuery);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Add to pending searches
      if (!this.pendingSearches.has(normalizedQuery)) {
        this.pendingSearches.set(normalizedQuery, []);
      }
      
      this.pendingSearches.get(normalizedQuery)!.push({
        query,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Set new timer
      const timer = setTimeout(async () => {
        const pending = this.pendingSearches.get(normalizedQuery) || [];
        this.pendingSearches.delete(normalizedQuery);
        this.searchTimers.delete(normalizedQuery);

        if (pending.length === 0) return;

        try {
          console.log(`Executing debounced search: "${query}" (${pending.length} requests combined)`);
          
          // Mark as recent search to prevent duplicates
          this.recentSearches.add(normalizedQuery);
          setTimeout(() => {
            this.recentSearches.delete(normalizedQuery);
          }, this.DEDUPLICATION_WINDOW);

          const results = await searchFunction(query);
          
          // Resolve all pending promises with the same results
          pending.forEach(search => search.resolve(results));
          
        } catch (error) {
          console.error(`Debounced search error for "${query}":`, error);
          pending.forEach(search => search.reject(error as Error));
        }
      }, this.DEBOUNCE_DELAY);

      this.searchTimers.set(normalizedQuery, timer);
    });
  }

  /**
   * Get statistics about search optimization
   */
  public getStats() {
    return {
      pendingSearches: this.pendingSearches.size,
      recentSearches: this.recentSearches.size,
      debounceDelay: this.DEBOUNCE_DELAY,
      deduplicationWindow: this.DEDUPLICATION_WINDOW
    };
  }

  /**
   * Clear all pending searches and timers
   */
  public clear() {
    this.searchTimers.forEach(timer => clearTimeout(timer));
    this.searchTimers.clear();
    this.pendingSearches.clear();
    this.recentSearches.clear();
  }
}

export const searchDebouncer = new SearchDebouncer();
