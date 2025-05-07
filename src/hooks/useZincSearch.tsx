
import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { toast } from 'sonner';
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

  // Cleanup function to prevent memory leaks
  const cleanup = () => {
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    // Reset results if search term is empty
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length < 2) {
      console.log('useZincSearch: Search term empty or too short, using default products');
      const defaultProducts = getMockProducts(5);
      setZincResults(defaultProducts);
      setFilteredProducts(defaultProducts);
      setLoading(false);
      return;
    }

    // Don't search if term is identical to previous search
    if (lastSearchTermRef.current === searchTerm) {
      return;
    }
    
    // Clear previous timeout to debounce searches
    cleanup();

    // Store current search term as the last one processed
    lastSearchTermRef.current = searchTerm;
    console.log(`useZincSearch: Processing search term: "${searchTerm}"`);
    
    // Set loading state
    setLoading(true);
    
    // Use a timeout to simulate network delay and debounce searches
    searchTimeoutRef.current = window.setTimeout(() => {
      try {
        // Filter local products first (faster response)
        const term = searchTerm.toLowerCase().trim();
        console.log(`useZincSearch: Filtering local products for "${term}"`);
        
        // Filter existing products
        const filtered = products
          .filter((product) => {
            try {
              if (!product) return false; // Skip null/undefined products
              
              const name = product.name ? product.name.toLowerCase() : "";
              if (name.includes(term)) return true;
              
              const title = product.title ? product.title.toLowerCase() : "";
              if (title.includes(term)) return true;
              
              const description = product.description ? product.description.toLowerCase() : "";
              if (description.includes(term)) return true;
              
              const brand = product.brand ? product.brand.toLowerCase() : "";
              if (brand.includes(term)) return true;
              
              return false;
            } catch (err) {
              console.error("Error filtering product:", err);
              return false;
            }
          })
          .slice(0, MAX_RESULTS);
        
        console.log(`useZincSearch: Found ${filtered.length} matching local products`);
        setFilteredProducts(filtered);

        // Get mock search results
        console.log(`useZincSearch: Getting mock search results for "${searchTerm}"`);
        const mockResults = searchMockProducts(searchTerm, MAX_RESULTS);
        
        // Process results
        if (mockResults && mockResults.length > 0) {
          console.log(`useZincSearch: Found ${mockResults.length} mock results`);
          setZincResults(mockResults);
        } else {
          console.log(`useZincSearch: No mock results found, using fallback`);
          // Fallback to some default products
          setZincResults(getMockProducts(5));
        }
        
      } catch (error) {
        console.error('useZincSearch: Error searching:', error);
        // Fallback to default products on error
        setZincResults(getMockProducts(5));
      } finally {
        setLoading(false);
      }
    }, 300); // Short delay for a smoother UX

    // Clean up on unmount or when search term changes
    return cleanup;
  }, [searchTerm, products]);

  return {
    loading,
    zincResults,
    filteredProducts,
    hasResults: (zincResults && zincResults.length > 0) || (filteredProducts && filteredProducts.length > 0)
  };
};
