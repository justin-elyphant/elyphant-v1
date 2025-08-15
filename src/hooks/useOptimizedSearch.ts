
/**
 * Hook for optimized search with cost controls
 */

import { useState, useEffect, useRef } from 'react';
import { unifiedMarketplaceService } from '@/services/marketplace/UnifiedMarketplaceService';
import { toast } from 'sonner';

export const useOptimizedSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSearchRef = useRef<string>('');

  const search = async (query: string, maxResults: number = 10) => {
    // Prevent duplicate searches
    if (query === lastSearchRef.current) {
      console.log(`Skipping duplicate search: "${query}"`);
      return results;
    }

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    lastSearchRef.current = query;

    if (!query.trim()) {
      setResults([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await optimizedZincService.optimizedSearch(query, maxResults);
      
      if (abortControllerRef.current?.signal.aborted) {
        return [];
      }

      setResults(searchResults);
      return searchResults;
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'Search failed';
        setError(errorMessage);
        console.error('Optimized search error:', err);
      }
      return [];
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const getStats = () => {
    return optimizedZincService.getStats();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    search,
    isLoading,
    results,
    error,
    getStats
  };
};
