
import { useState, useEffect, useRef, useCallback } from 'react';
import { searchCacheService } from '@/services/cache/searchCacheService';
import { ZincProduct } from '@/components/marketplace/zinc/types';

interface UseOptimizedSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxSearchesPerSession?: number;
  onSearchStart?: () => void;
  onSearchComplete?: (results: ZincProduct[], fromCache: boolean) => void;
  onSearchError?: (error: string) => void;
}

interface SearchSession {
  searchCount: number;
  startTime: number;
  lastSearchTime: number;
}

export const useOptimizedSearch = (
  searchFunction: (query: string) => Promise<ZincProduct[]>,
  options: UseOptimizedSearchOptions = {}
) => {
  const {
    debounceMs = 500,
    minQueryLength = 3,
    maxSearchesPerSession = 50,
    onSearchStart,
    onSearchComplete,
    onSearchError
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ZincProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Session tracking
  const sessionRef = useRef<SearchSession>({
    searchCount: 0,
    startTime: Date.now(),
    lastSearchTime: 0
  });
  
  // Request management
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>('');
  const pendingQueryRef = useRef<string>('');

  // Query validation
  const isValidQuery = useCallback((query: string): boolean => {
    if (!query || typeof query !== 'string') return false;
    
    const trimmed = query.trim();
    if (trimmed.length < minQueryLength) return false;
    
    // Check session limits
    const now = Date.now();
    const session = sessionRef.current;
    
    // Reset session if it's been more than 1 hour
    if (now - session.startTime > 60 * 60 * 1000) {
      session.searchCount = 0;
      session.startTime = now;
    }
    
    if (session.searchCount >= maxSearchesPerSession) {
      setError(`Search limit reached (${maxSearchesPerSession} searches per session). Please try again later.`);
      return false;
    }
    
    return true;
  }, [minQueryLength, maxSearchesPerSession]);

  // Cancel any pending requests
  const cancelPendingRequests = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Perform the actual search
  const performSearch = useCallback(async (query: string): Promise<void> => {
    if (!isValidQuery(query)) return;
    
    const trimmedQuery = query.trim();
    
    // Don't search if it's the same as the last query
    if (trimmedQuery === lastQueryRef.current) {
      return;
    }
    
    lastQueryRef.current = trimmedQuery;
    setError(null);
    
    // Check cache first
    const cachedResults = searchCacheService.getCachedResults(trimmedQuery);
    if (cachedResults && cachedResults.length > 0) {
      setResults(cachedResults);
      setIsLoading(false);
      onSearchComplete?.(cachedResults, true);
      return;
    }
    
    // Update session tracking
    const session = sessionRef.current;
    session.searchCount++;
    session.lastSearchTime = Date.now();
    
    setIsLoading(true);
    onSearchStart?.();
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      console.log(`Performing API search for: "${trimmedQuery}" (Search #${session.searchCount})`);
      
      const searchResults = await searchFunction(trimmedQuery);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('Search request was aborted');
        return;
      }
      
      // Cache the results
      if (searchResults && searchResults.length > 0) {
        searchCacheService.cacheResults(trimmedQuery, searchResults);
      }
      
      setResults(searchResults || []);
      onSearchComplete?.(searchResults || [], false);
      
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        console.log('Search request was aborted due to error');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      console.error('Search error:', errorMessage);
      setError(errorMessage);
      onSearchError?.(errorMessage);
      setResults([]);
      
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isValidQuery, searchFunction, onSearchStart, onSearchComplete, onSearchError]);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    // Cancel any existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Cancel any pending API requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    pendingQueryRef.current = query;
    
    // Don't debounce if query is too short
    if (!query || query.trim().length < minQueryLength) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Set loading immediately for UX
    setIsLoading(true);
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (pendingQueryRef.current === query) {
        performSearch(query);
      }
    }, debounceMs);
  }, [debounceMs, minQueryLength, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingRequests();
    };
  }, [cancelPendingRequests]);

  // Get session and cache stats
  const getStats = useCallback(() => {
    const cacheStats = searchCacheService.getStats();
    const session = sessionRef.current;
    
    return {
      ...cacheStats,
      sessionSearches: session.searchCount,
      sessionStartTime: session.startTime,
      lastSearchTime: session.lastSearchTime,
      searchesRemaining: Math.max(0, maxSearchesPerSession - session.searchCount)
    };
  }, [maxSearchesPerSession]);

  return {
    search: debouncedSearch,
    results,
    isLoading,
    error,
    cancelSearch: cancelPendingRequests,
    getStats,
    clearCache: searchCacheService.clearAll
  };
};
