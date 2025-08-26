/**
 * Background prefetching service for marketplace searches
 */

interface PrefetchConfig {
  enabled: boolean;
  maxConcurrentRequests: number;
  prefetchDelay: number;
  cacheSize: number;
}

interface SearchPattern {
  query: string;
  frequency: number;
  lastUsed: number;
  context?: string;
}

class BackgroundPrefetchingService {
  private config: PrefetchConfig = {
    enabled: true,
    maxConcurrentRequests: 3,
    prefetchDelay: 1000, // 1 second delay
    cacheSize: 50
  };

  private searchPatterns = new Map<string, SearchPattern>();
  private prefetchQueue: string[] = [];
  private activePrefetches = new Set<string>();
  private userBehavior = {
    currentInterests: [] as string[],
    recentSearches: [] as string[],
    sessionDuration: 0,
    deviceType: 'desktop'
  };

  constructor() {
    this.loadUserBehavior();
    this.detectDeviceType();
    this.startBackgroundAnalysis();
  }

  // Track user search behavior
  trackSearch(query: string, context?: string): void {
    if (!this.config.enabled) return;

    const normalizedQuery = query.toLowerCase().trim();
    const now = Date.now();

    // Update search patterns
    const existing = this.searchPatterns.get(normalizedQuery);
    if (existing) {
      existing.frequency++;
      existing.lastUsed = now;
      if (context) existing.context = context;
    } else {
      this.searchPatterns.set(normalizedQuery, {
        query: normalizedQuery,
        frequency: 1,
        lastUsed: now,
        context
      });
    }

    // Update recent searches
    this.userBehavior.recentSearches.unshift(normalizedQuery);
    if (this.userBehavior.recentSearches.length > 10) {
      this.userBehavior.recentSearches = this.userBehavior.recentSearches.slice(0, 10);
    }

    // Extract interests from query
    this.extractInterests(normalizedQuery);

    // Trigger prefetching based on this search
    this.triggerSmartPrefetch(normalizedQuery);

    // Persist behavior data
    this.saveUserBehavior();
  }

  // Extract interests from search queries
  private extractInterests(query: string): void {
    const interests = [
      'electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'toys',
      'jewelry', 'tech', 'gadgets', 'fashion', 'fitness', 'cooking', 'art'
    ];

    interests.forEach(interest => {
      if (query.includes(interest) && !this.userBehavior.currentInterests.includes(interest)) {
        this.userBehavior.currentInterests.push(interest);
      }
    });

    // Limit interests to top 5
    if (this.userBehavior.currentInterests.length > 5) {
      this.userBehavior.currentInterests = this.userBehavior.currentInterests.slice(0, 5);
    }
  }

  // Smart prefetching based on user behavior
  private triggerSmartPrefetch(currentQuery: string): void {
    const suggestions = this.generatePrefetchSuggestions(currentQuery);
    
    // Add to prefetch queue with delay
    setTimeout(() => {
      suggestions.forEach(suggestion => {
        if (!this.prefetchQueue.includes(suggestion) && 
            !this.activePrefetches.has(suggestion)) {
          this.prefetchQueue.push(suggestion);
        }
      });
      
      this.processPrefetchQueue();
    }, this.config.prefetchDelay);
  }

  // Generate prefetch suggestions based on patterns
  private generatePrefetchSuggestions(currentQuery: string): string[] {
    const suggestions: string[] = [];
    
    // Related searches based on patterns
    const related = this.getRelatedSearches(currentQuery);
    suggestions.push(...related);

    // Interest-based suggestions
    const interestBased = this.getInterestBasedSuggestions();
    suggestions.push(...interestBased);

    // Trending searches (mock data - would come from analytics)
    const trending = this.getTrendingSuggestions();
    suggestions.push(...trending);

    // Remove duplicates and current query
    return [...new Set(suggestions)]
      .filter(s => s !== currentQuery)
      .slice(0, 8); // Limit suggestions
  }

  // Get related searches based on similarity
  private getRelatedSearches(query: string): string[] {
    const related: string[] = [];
    
    for (const [searchQuery, pattern] of this.searchPatterns.entries()) {
      if (searchQuery === query) continue;
      
      // Simple similarity check
      const similarity = this.calculateSimilarity(query, searchQuery);
      if (similarity > 0.3 && pattern.frequency > 1) {
        related.push(searchQuery);
      }
    }
    
    return related.slice(0, 3);
  }

  // Calculate simple string similarity
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // Get suggestions based on user interests
  private getInterestBasedSuggestions(): string[] {
    return this.userBehavior.currentInterests
      .map(interest => `${interest} gifts`)
      .slice(0, 3);
  }

  // Get trending suggestions (mock data)
  private getTrendingSuggestions(): string[] {
    const trending = [
      'holiday gifts', 'birthday presents', 'anniversary gifts',
      'tech gadgets', 'home decor', 'fashion accessories'
    ];
    
    return trending.slice(0, 2);
  }

  // Process prefetch queue
  private async processPrefetchQueue(): Promise<void> {
    while (this.prefetchQueue.length > 0 && 
           this.activePrefetches.size < this.config.maxConcurrentRequests) {
      
      const query = this.prefetchQueue.shift();
      if (!query) continue;

      this.activePrefetches.add(query);
      
      try {
        await this.prefetchSearch(query);
      } catch (error) {
        console.warn('Prefetch failed for:', query, error);
      } finally {
        this.activePrefetches.delete(query);
      }
    }
  }

  // Prefetch a specific search
  private async prefetchSearch(query: string): Promise<void> {
    try {
      console.log('🚀 Background prefetching:', query);
      
      // Use service worker for prefetching if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PREFETCH_SEARCHES',
          queries: [query]
        });
      } else {
        // Fallback to direct fetch
        const searchUrl = `/functions/v1/enhanced-zinc-search?query=${encodeURIComponent(query)}&limit=10`;
        const response = await fetch(searchUrl);
        
        if (response.ok) {
          console.log('✅ Prefetched:', query);
        }
      }
    } catch (error) {
      console.warn('Prefetch error:', error);
    }
  }

  // Load user behavior from storage
  private loadUserBehavior(): void {
    try {
      const stored = localStorage.getItem('marketplace-user-behavior');
      if (stored) {
        const data = JSON.parse(stored);
        this.userBehavior = { ...this.userBehavior, ...data };
      }
    } catch (error) {
      console.warn('Failed to load user behavior:', error);
    }
  }

  // Save user behavior to storage
  private saveUserBehavior(): void {
    try {
      localStorage.setItem('marketplace-user-behavior', JSON.stringify(this.userBehavior));
    } catch (error) {
      console.warn('Failed to save user behavior:', error);
    }
  }

  // Detect device type for optimization
  private detectDeviceType(): void {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.userBehavior.deviceType = isMobile ? 'mobile' : 'desktop';
    
    // Adjust config for mobile
    if (isMobile) {
      this.config.maxConcurrentRequests = 2;
      this.config.prefetchDelay = 2000; // Longer delay on mobile
    }
  }

  // Start background analysis
  private startBackgroundAnalysis(): void {
    // Analyze patterns every 30 seconds
    setInterval(() => {
      this.analyzeSearchPatterns();
    }, 30000);
  }

  // Analyze search patterns for optimization
  private analyzeSearchPatterns(): void {
    if (this.searchPatterns.size === 0) return;

    // Find popular searches that might benefit from prefetching
    const popular = Array.from(this.searchPatterns.values())
      .filter(pattern => pattern.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Add to prefetch queue if not already there
    popular.forEach(pattern => {
      if (!this.prefetchQueue.includes(pattern.query) && 
          !this.activePrefetches.has(pattern.query)) {
        this.prefetchQueue.push(pattern.query);
      }
    });

    // Clean up old patterns
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [query, pattern] of this.searchPatterns.entries()) {
      if (now - pattern.lastUsed > oneHour && pattern.frequency === 1) {
        this.searchPatterns.delete(query);
      }
    }
  }

  // Get current statistics
  getStatistics() {
    return {
      totalPatterns: this.searchPatterns.size,
      queueSize: this.prefetchQueue.length,
      activePrefetches: this.activePrefetches.size,
      currentInterests: this.userBehavior.currentInterests,
      recentSearches: this.userBehavior.recentSearches,
      deviceType: this.userBehavior.deviceType,
      config: this.config
    };
  }

  // Enable/disable prefetching
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (!enabled) {
      this.prefetchQueue.length = 0;
      this.activePrefetches.clear();
    }
  }
}

export const backgroundPrefetchingService = new BackgroundPrefetchingService();