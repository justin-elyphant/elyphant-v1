
import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { normalizeProduct } from '@/contexts/ProductContext';
import { searchMockProducts, getMockProducts } from '@/components/marketplace/services/mockProductService';

// Maximum results to prevent performance issues
const MAX_RESULTS = 20;

export const useZincSearch = (searchTerm: string) => {
  const [loading, setLoading] = useState(false);
  const [zincResults, setZincResults] = useState<any[]>([]);
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const searchTimeoutRef = useRef<number | null>(null);
  const lastSearchTermRef = useRef<string>("");
  const initialDataLoadedRef = useRef<boolean>(false);

  // Cleanup function to prevent memory leaks
  const cleanup = () => {
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  // Load initial data if nothing is provided
  useEffect(() => {
    if (!initialDataLoadedRef.current) {
      console.log('useZincSearch: Loading initial data');
      const defaultProducts = getMockProducts(5);
      setZincResults(defaultProducts);
      setFilteredProducts(defaultProducts);
      initialDataLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    // Reset results if search term is empty
    if (!searchTerm || searchTerm.trim() === '') {
      setLoading(false);
      setZincResults([]);
      setFilteredProducts([]);
      lastSearchTermRef.current = "";
      cleanup();
      return;
    }

    // Don't search if term hasn't changed
    if (searchTerm === lastSearchTermRef.current) {
      return;
    }

    console.log(`useZincSearch: Searching for "${searchTerm}"`);
    lastSearchTermRef.current = searchTerm;
    
    // Clear any existing timeout
    cleanup();
    
    setLoading(true);
    
    // Set a timeout to ensure loading state gets cleared
    searchTimeoutRef.current = window.setTimeout(() => {
      try {
        // Use mock search for now
        const mockResults = searchMockProducts(searchTerm, MAX_RESULTS);
        console.log(`useZincSearch: Found ${mockResults.length} results for "${searchTerm}"`);
        
        setZincResults(mockResults);
        setFilteredProducts(mockResults);
      } catch (error) {
        console.error('useZincSearch: Error in search:', error);
        setZincResults([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    }, 500); // Small delay to show loading state
    
    // Cleanup timeout after 3 seconds max to prevent stuck loading
    const maxTimeout = window.setTimeout(() => {
      console.log('useZincSearch: Force clearing loading state');
      setLoading(false);
    }, 3000);
    
    return () => {
      cleanup();
      window.clearTimeout(maxTimeout);
    };
  }, [searchTerm]);

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      setFilteredProducts(zincResults);
      return;
    }

    const filtered = products.filter(product => {
      const title = product.title || product.name || '';
      const description = product.description || '';
      const category = product.category || '';
      
      const searchLower = searchTerm.toLowerCase();
      
      return (
        title.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        category.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredProducts(filtered.slice(0, MAX_RESULTS));
  }, [searchTerm, products, zincResults]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  const hasResults = zincResults.length > 0 || filteredProducts.length > 0;

  return {
    loading,
    zincResults,
    filteredProducts,
    hasResults
  };
};
