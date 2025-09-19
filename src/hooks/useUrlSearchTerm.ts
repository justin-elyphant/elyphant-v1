import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useUrlSearchTerm = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const urlSearchTerm = searchParams.get('search');
    if (urlSearchTerm && urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [searchParams, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    hasSearch: Boolean(searchTerm)
  };
};