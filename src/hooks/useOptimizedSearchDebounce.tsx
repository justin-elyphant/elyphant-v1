import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createBoundedMemoization } from '@/utils/performanceOptimizations';

interface UseOptimizedSearchDebounceProps {
  initialValue?: string;
  delay?: number;
  minLength?: number;
  maxLength?: number;
}

interface SearchState {
  searchTerm: string;
  debouncedSearchTerm: string;
  isSearching: boolean;
  isValidSearch: boolean;
}

// Memoized search validation
const memoizedValidateSearch = createBoundedMemoization((term: string, minLength: number, maxLength: number) => {
  const trimmed = term.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}, 100);

export const useOptimizedSearchDebounce = ({ 
  initialValue = '', 
  delay = 300,
  minLength = 2,
  maxLength = 100
}: UseOptimizedSearchDebounceProps = {}): SearchState & {
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  forceSearch: () => void;
} => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastValidSearchRef = useRef<string>(initialValue);
  const mountedRef = useRef(true);

  // Memoized search validation
  const isValidSearch = useMemo(() => 
    memoizedValidateSearch(searchTerm, minLength, maxLength),
    [searchTerm, minLength, maxLength]
  );

  // Optimized debounce effect with cleanup and validation
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set searching state if there's a meaningful change
    const isDifferent = searchTerm !== debouncedSearchTerm;
    const isValid = isValidSearch;
    
    if (isDifferent && isValid) {
      setIsSearching(true);
    } else if (isDifferent && !isValid) {
      // Invalid search - clear immediately without debouncing
      setDebouncedSearchTerm('');
      setIsSearching(false);
      return;
    }

    // Set new timeout only for valid searches
    if (isValid && isDifferent) {
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setDebouncedSearchTerm(searchTerm);
          setIsSearching(false);
          lastValidSearchRef.current = searchTerm;
        }
      }, delay);
    } else if (!isDifferent) {
      setIsSearching(false);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, delay, debouncedSearchTerm, isValidSearch]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Optimized clear function
  const clearSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setIsSearching(false);
    lastValidSearchRef.current = '';
  }, []);

  // Force search function (bypass debounce)
  const forceSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (isValidSearch) {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
      lastValidSearchRef.current = searchTerm;
    }
  }, [searchTerm, isValidSearch]);

  // Optimized setter with validation
  const optimizedSetSearchTerm = useCallback((term: string) => {
    // Prevent unnecessary updates
    if (term === searchTerm) return;
    
    // Basic sanitization
    const sanitized = term.replace(/[<>]/g, '').substring(0, maxLength);
    setSearchTerm(sanitized);
  }, [searchTerm, maxLength]);

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    isValidSearch,
    setSearchTerm: optimizedSetSearchTerm,
    clearSearch,
    forceSearch
  };
};