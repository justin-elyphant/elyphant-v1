import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useUrlSearchTerm = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const urlSearchTerm = searchParams.get('search');
    // Always update the search term to match URL (including clearing when no search param)
    setSearchTerm(urlSearchTerm || '');
  }, [searchParams]);

  return {
    searchTerm,
    setSearchTerm,
    hasSearch: Boolean(searchTerm)
  };
};