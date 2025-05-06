
import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { searchProducts } from '@/components/marketplace/zinc/zincService';
import { toast } from 'sonner';
import { normalizeProduct } from '@/components/marketplace/product-item/productUtils';

export const useZincSearch = (searchTerm: string) => {
  const [loading, setLoading] = useState(false);
  const [zincResults, setZincResults] = useState<any[]>([]);
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
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
            product.name.toLowerCase().includes(term) || 
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
        const results = await searchProducts(searchQuery);
        
        // Process results
        if (results && Array.isArray(results)) {
          console.log(`Found ${results.length} results from Zinc API for "${searchQuery}"`);
          
          // Map and normalize each product
          const processedResults = results.map(item => normalizeProduct({
            id: item.product_id || `zinc-${Math.random().toString(36).substring(2, 11)}`,
            product_id: item.product_id || `zinc-${Math.random().toString(36).substring(2, 11)}`,
            title: item.title,
            name: item.title,
            price: item.price,
            image: item.images?.[0] || item.image || "/placeholder.svg",
            images: item.images || (item.image ? [item.image] : ["/placeholder.svg"]),
            rating: typeof item.rating === 'number' ? item.rating : 0,
            stars: typeof item.rating === 'number' ? item.rating : 0, 
            reviewCount: typeof item.review_count === 'number' ? item.review_count : 0,
            num_reviews: typeof item.review_count === 'number' ? item.review_count : 0,
            brand: item.brand || 'Unknown',
            category: item.category || getSearchCategory(searchTerm),
            // Keep the original data for reference
            originalProduct: item
          }));
          
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

    // Helper function to determine category from search term
    const getSearchCategory = (term: string): string => {
      const lowercased = term.toLowerCase();
      if (lowercased.includes('macbook') || lowercased.includes('laptop')) {
        return 'Computers';
      }
      if (lowercased.includes('hat') || lowercased.includes('cap')) {
        return 'Clothing';
      }
      if (lowercased.includes('padres') || lowercased.includes('cowboys')) {
        return 'Sports Merchandise';
      }
      return 'Electronics';
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
