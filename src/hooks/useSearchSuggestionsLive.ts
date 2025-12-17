/**
 * useSearchSuggestionsLive - Real-time search suggestions hook
 * Uses lightweight search-suggestions edge function
 * Debounced to prevent excessive API calls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchSuggestion {
  text: string;
  type: 'trending' | 'suggestion' | 'product';
  count?: number;
}

export interface ProductSuggestion {
  id: string;
  title: string;
  price: number;
  image: string;
  brand?: string;
  type: 'product';
}

export interface SearchSuggestionsResult {
  suggestions: SearchSuggestion[];
  trending: SearchSuggestion[];
  products: ProductSuggestion[];
  isLoading: boolean;
  error: string | null;
}

export function useSearchSuggestionsLive(
  query: string,
  debounceMs: number = 300
): SearchSuggestionsResult {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [trending, setTrending] = useState<SearchSuggestion[]>([]);
  const [products, setProducts] = useState<ProductSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    // Cancel any pending request
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('search-suggestions', {
        body: { query: searchQuery, limit: 8 }
      });

      if (invokeError) {
        throw invokeError;
      }

      setSuggestions(data?.suggestions || []);
      setTrending(data?.trending || []);
      setProducts(data?.products || []);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[useSearchSuggestionsLive] Error:', err);
        setError(err.message || 'Failed to fetch suggestions');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If empty query, fetch trending immediately
    if (!query || query.trim().length < 2) {
      fetchSuggestions('');
      return;
    }

    // Debounce the search
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(query.trim());
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, debounceMs, fetchSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    trending,
    products,
    isLoading,
    error
  };
}

export default useSearchSuggestionsLive;
