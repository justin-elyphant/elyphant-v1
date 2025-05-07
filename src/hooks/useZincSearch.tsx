
import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { searchProducts } from '@/components/marketplace/zinc/zincService';
import { toast } from 'sonner';
import { normalizeProduct } from '@/contexts/ProductContext';
import { findMatchingProducts } from '@/components/marketplace/zinc/utils/findMatchingProducts';

export const useZincSearch = (searchTerm: string) => {
  const [loading, setLoading] = useState(false);
  const [zincResults, setZincResults] = useState<any[]>([]);
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const toastRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasShownTokenErrorRef = useRef(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const lastSearchTermRef = useRef<string>("");
  const isSearchingRef = useRef(false);

  useEffect(() => {
    // Don't search if term is identical to previous search to avoid redundant API calls
    if (lastSearchTermRef.current === searchTerm || isSearchingRef.current) {
      return;
    }
    
    // Clear previous timeout to debounce searches
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Reset results if search term is empty
    if (!searchTerm || searchTerm.trim().length < 2) {
      setZincResults([]);
      setFilteredProducts([]);
      return;
    }

    // Store current search term as the last one processed
    lastSearchTermRef.current = searchTerm;
    
    const fetchZincResults = async () => {
      if (isSearchingRef.current) return;
      isSearchingRef.current = true;
      setLoading(true);
      
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        // Show loading toast (only once)
        if (toastRef.current) {
          toast.dismiss(toastRef.current);
        }
        
        // Filter local products first (faster response)
        const term = searchTerm.toLowerCase();
        
        // Use more efficient filtering with early returns and limit to 50 products max
        const filtered = products.filter((product, index) => {
          if (index >= 50) return false; // Limit to first 50 products for performance
          
          const name = product.name ? product.name.toLowerCase() : "";
          if (name.includes(term)) return true;
          
          const title = product.title ? product.title.toLowerCase() : "";
          if (title.includes(term)) return true;
          
          const description = product.description ? product.description.toLowerCase() : "";
          if (description.includes(term)) return true;
          
          const brand = product.brand ? product.brand.toLowerCase() : "";
          if (brand.includes(term)) return true;
          
          return false;
        });
        
        setFilteredProducts(filtered);
        
        // Special case mappings for popular searches - this improves results quality
        let searchQuery = searchTerm;
        if (term.includes('macbook') || term.includes('mac book')) {
          searchQuery = 'apple macbook';
        }
        else if ((term.includes('padres') && (term.includes('hat') || term.includes('cap'))) ||
                 (term.includes('san diego') && (term.includes('hat') || term.includes('cap')))) {
          searchQuery = 'san diego padres baseball hat';
        }
        
        console.log(`Searching Zinc API for "${searchQuery}"...`);
        
        // Get results from Zinc API (through our service) with a timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Search request timeout')), 8000);
        });
        
        let results;
        
        try {
          // Try using searchProducts from zincService first
          // Limit number of results to improve performance
          const resultsPromise = searchProducts(searchQuery, "25");
          
          // Race between the API call and the timeout
          results = await Promise.race([resultsPromise, timeoutPromise]);
        } catch (err) {
          console.log('Error with primary search method, falling back to findMatchingProducts', err);
          // Fallback to findMatchingProducts if searchProducts fails
          results = findMatchingProducts(searchQuery);
        }
        
        // Process results
        if (results && Array.isArray(results)) {
          console.log(`Found ${results.length} results from Zinc API for "${searchQuery}"`);
          
          // Map to consistent format with proper types - use batch processing for better performance
          const processedResults = results.map(item => normalizeProduct({
            product_id: item.product_id || `zinc-${Math.random().toString(36).substring(2, 11)}`,
            id: item.product_id || `zinc-${Math.random().toString(36).substring(2, 11)}`,
            title: item.title || "Unknown Product",
            name: item.title || "Unknown Product",
            price: item.price || 0,
            image: item.images?.[0] || item.image || "/placeholder.svg",
            images: item.images || (item.image ? [item.image] : ["/placeholder.svg"]),
            rating: typeof item.rating === 'number' ? item.rating : 0,
            stars: typeof item.rating === 'number' ? item.rating : 0, 
            reviewCount: typeof item.review_count === 'number' ? item.review_count : 0,
            num_reviews: typeof item.review_count === 'number' ? item.review_count : 0,
            brand: item.brand || 'Unknown',
            category: item.category || getSearchCategory(searchTerm),
          }));
          
          // Limit max results to avoid performance issues
          const limitedResults = processedResults.slice(0, 50);
          setZincResults(limitedResults);
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
        // Add a slight delay before allowing new searches to prevent thrashing
        setTimeout(() => {
          isSearchingRef.current = false;
        }, 500);
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

    // Use a debounce to avoid excessive API calls
    searchTimeoutRef.current = window.setTimeout(() => {
      fetchZincResults();
    }, 800); // increased debounce time for better performance

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
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
