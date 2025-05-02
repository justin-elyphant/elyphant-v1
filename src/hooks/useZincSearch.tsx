
import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { searchProducts } from '@/components/marketplace/zinc/zincService';
import { toast } from 'sonner';
import { ZincProduct } from '@/components/marketplace/zinc/types';
import { Product } from '@/types/product';
import { convertZincProductToProduct } from '@/components/marketplace/zinc/utils/productConverter';

export const useZincSearch = (searchTerm: string) => {
  const [loading, setLoading] = useState(false);
  const [zincResults, setZincResults] = useState<Product[]>([]);
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const toastRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasShownTokenErrorRef = useRef(false);

  useEffect(() => {
    const fetchZincResults = async () => {
      // Reset results if search term is empty
      if (!searchTerm || searchTerm.trim().length < 2) {
        setZincResults([]);
        setFilteredProducts([]);
        return;
      }

      setLoading(true);
      
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        // Show loading toast
        if (toastRef.current) {
          toast.dismiss(toastRef.current);
        }
        
        // Filter local products first (faster response)
        const term = searchTerm.toLowerCase();
        const filtered = products.filter(
          product => 
            product.name?.toLowerCase().includes(term) || 
            (product.description && product.description.toLowerCase().includes(term)) ||
            (product.brand && product.brand.toLowerCase().includes(term))
        );
        setFilteredProducts(filtered);
        
        // Now search Zinc API for real products (or mocks if no token)
        console.log(`Searching Zinc API for "${searchTerm}"...`);

        // Special case mappings for popular searches
        let searchQuery = searchTerm;
        if (term.includes('macbook') || term.includes('mac book')) {
          searchQuery = 'apple macbook';
          console.log(`Mapped search term to "${searchQuery}"`);
        }
        else if ((term.includes('padres') && (term.includes('hat') || term.includes('cap'))) ||
                 (term.includes('san diego') && (term.includes('hat') || term.includes('cap')))) {
          searchQuery = 'san diego padres baseball hat';
          console.log(`Mapped search term to "${searchQuery}"`);
        }
        
        // Get results from Zinc API (through our service)
        const zincApiResults = await searchProducts(searchQuery);
        
        // Process results
        if (zincApiResults && Array.isArray(zincApiResults)) {
          console.log(`Found ${zincApiResults.length} results from Zinc API for "${searchQuery}"`);
          
          // Convert zinc products to regular products
          const processedResults = zincApiResults.map((item: ZincProduct) => convertZincProductToProduct(item));
          
          setZincResults(processedResults);
        } else {
          console.log(`No results found from Zinc API for "${searchTerm}"`);
          setZincResults([]);
        }
        
      } catch (error) {
        // Only log error if not aborted
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error searching Zinc API:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    // Debounce function to avoid making too many requests
    const timeoutId = setTimeout(() => {
      fetchZincResults();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTerm, products]);

  return {
    loading,
    zincResults,
    filteredProducts,
    hasResults: zincResults.length > 0 || filteredProducts.length > 0
  };
};
