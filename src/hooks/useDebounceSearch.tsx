
import { useState, useEffect, useRef } from 'react';

interface UseDebounceSearchProps {
  initialValue?: string;
  delay?: number;
}

export const useDebounceSearch = ({ 
  initialValue = '', 
  delay = 300 
}: UseDebounceSearchProps = {}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set searching state if there's a change
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, delay);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, delay, debouncedSearchTerm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setIsSearching(false);
  };

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    setSearchTerm,
    clearSearch
  };
};
