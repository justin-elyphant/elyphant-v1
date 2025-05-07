
import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { searchProducts } from '@/components/marketplace/zinc/zincService';
import { toast } from 'sonner';
import { normalizeProduct } from '@/contexts/ProductContext';
import { findMatchingProducts } from '@/components/marketplace/zinc/utils/findMatchingProducts';

// Maximum results to prevent performance issues
const MAX_RESULTS = 20;

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
  const errorCountRef = useRef(0);
  const searchStartTimeRef = useRef<number | null>(null);

  // Cleanup function to prevent memory leaks
  const cleanup = () => {
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    // Reset results if search term is empty
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length < 2) {
      console.log('useZincSearch: Search term empty or too short, resetting results');
      setZincResults([]);
      setFilteredProducts([]);
      return;
    }

    // Don't search if term is identical to previous search to avoid redundant API calls
    // Or if another search is already in progress
    if (lastSearchTermRef.current === searchTerm || isSearchingRef.current) {
      return;
    }
    
    // Clear previous timeout to debounce searches
    cleanup();

    // Store current search term as the last one processed
    lastSearchTermRef.current = searchTerm;
    console.log(`useZincSearch: Processing new search term: "${searchTerm}"`);
    
    const fetchZincResults = async () => {
      if (isSearchingRef.current) return;
      
      try {
        // Mark search as started
        isSearchingRef.current = true;
        searchStartTimeRef.current = Date.now();
        setLoading(true);
        console.log(`useZincSearch: Starting search for "${searchTerm}"`);
        
        // Create a new AbortController for this search
        abortControllerRef.current = new AbortController();
        
        // Show loading toast (only once)
        if (toastRef.current) {
          toast.dismiss(toastRef.current);
        }
        
        // Filter local products first (faster response)
        const term = searchTerm.toLowerCase().trim();
        console.log(`useZincSearch: Filtering local products for "${term}"`);
        
        // Use more efficient filtering with early returns and limit to MAX_RESULTS products max
        const filtered = products
          .filter((product, index) => {
            try {
              if (index >= MAX_RESULTS) return false; // Limit results
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

        // Avoid long-running searches
        const maxSearchTime = 10000; // 10 seconds max
        const searchTimeout = setTimeout(() => {
          if (isSearchingRef.current && searchStartTimeRef.current) {
            console.log(`useZincSearch: Search timed out after ${Date.now() - searchStartTimeRef.current}ms`);
            abortControllerRef.current?.abort();
            setLoading(false);
            isSearchingRef.current = false;
          }
        }, maxSearchTime);
        
        // Special case mappings for popular searches - this improves results quality
        let searchQuery = searchTerm;
        if (term.includes('macbook') || term.includes('mac book')) {
          searchQuery = 'apple macbook';
          console.log(`useZincSearch: Detected MacBook search, using query "${searchQuery}"`);
        }
        else if ((term.includes('padres') && (term.includes('hat') || term.includes('cap'))) ||
                (term.includes('san diego') && (term.includes('hat') || term.includes('cap')))) {
          searchQuery = 'san diego padres baseball hat';
          console.log(`useZincSearch: Detected Padres hat search, using query "${searchQuery}"`);
        }
        
        console.log(`useZincSearch: Searching Zinc API for "${searchQuery}"...`);
        
        let results;
        
        try {
          // Try using searchProducts from zincService first
          console.log(`useZincSearch: Attempting primary search method with searchProducts()`);
          const resultsPromise = searchProducts(searchQuery, MAX_RESULTS.toString());
          
          results = await Promise.race([
            resultsPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Search request timeout')), 8000)
            )
          ]);
          
          console.log(`useZincSearch: Primary search method succeeded with ${results?.length || 0} results`);
        } catch (err) {
          console.log('useZincSearch: Error with primary search method, falling back to findMatchingProducts', err);
          
          // Fallback to findMatchingProducts if searchProducts fails
          try {
            results = findMatchingProducts(searchQuery);
            console.log(`useZincSearch: Fallback search returned ${results?.length || 0} results`);
          } catch (fallbackErr) {
            console.error('useZincSearch: Both primary and fallback search methods failed', fallbackErr);
            results = []; // Ensure results is always defined as an array
          }
        }
        
        // Clear the search timeout
        clearTimeout(searchTimeout);
        
        // Process results
        if (results && Array.isArray(results) && results.length > 0) {
          console.log(`useZincSearch: Found ${results.length} results from Zinc API for "${searchQuery}"`);
          
          // Map to consistent format with proper types - use batch processing for better performance
          const processedResults = results
            .filter(item => item) // Filter out null/undefined items
            .map(item => {
              try {
                const productId = item.product_id || `zinc-${Math.random().toString(36).substring(2, 11)}`;
                
                return normalizeProduct({
                  product_id: productId,
                  id: productId,
                  title: item.title || "Unknown Product",
                  name: item.title || "Unknown Product",
                  price: typeof item.price === 'number' ? item.price : 0,
                  image: item.images?.[0] || item.image || "/placeholder.svg",
                  images: item.images || (item.image ? [item.image] : ["/placeholder.svg"]),
                  rating: typeof item.rating === 'number' ? item.rating : 0,
                  stars: typeof item.rating === 'number' ? item.rating : 0, 
                  reviewCount: typeof item.review_count === 'number' ? item.review_count : 0,
                  num_reviews: typeof item.review_count === 'number' ? item.review_count : 0,
                  brand: item.brand || 'Unknown',
                  category: item.category || getSearchCategory(searchTerm),
                });
              } catch (err) {
                console.error('useZincSearch: Error processing result item', err);
                // Return a minimal valid product to avoid crashing
                return {
                  id: `error-${Math.random().toString(36).substring(2, 11)}`,
                  product_id: `error-${Math.random().toString(36).substring(2, 11)}`,
                  name: "Product (Error Loading)",
                  title: "Product (Error Loading)",
                  price: 0,
                  image: "/placeholder.svg",
                  images: ["/placeholder.svg"],
                  rating: 0,
                  stars: 0,
                  reviewCount: 0,
                  num_reviews: 0,
                  brand: 'Unknown',
                  category: 'Unknown',
                };
              }
            })
            .filter(item => item !== null); // Filter out any null items
          
          // Limit max results to avoid performance issues
          const limitedResults = processedResults.slice(0, MAX_RESULTS);
          console.log(`useZincSearch: Processed ${processedResults.length} results, limited to ${limitedResults.length}`);
          setZincResults(limitedResults);
          
          // Reset error counter on success
          errorCountRef.current = 0;
        } else {
          console.log(`useZincSearch: No results found from Zinc API for "${searchTerm}"`);
          setZincResults([]);
        }
        
      } catch (error) {
        // Only log error if not aborted
        const isAbortError = error instanceof DOMException && error.name === 'AbortError';
        if (!isAbortError) {
          console.error('useZincSearch: Error searching Zinc API:', error);
          errorCountRef.current += 1;
          
          // If we've had multiple errors in a row, show an error toast but not too frequently
          if (errorCountRef.current >= 3) {
            toast.error("Search is experiencing issues", {
              description: "We're having trouble with the search feature. Please try again later.",
              id: "search-error-toast"
            });
          }
        }
      } finally {
        setLoading(false);
        console.log(`useZincSearch: Search completed for "${searchTerm}"`);
        
        // Add a slight delay before allowing new searches to prevent thrashing
        setTimeout(() => {
          isSearchingRef.current = false;
          searchStartTimeRef.current = null;
        }, 300);
      }
    };

    // Helper function to determine category from search term
    const getSearchCategory = (term: string): string => {
      try {
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
      } catch (err) {
        console.error("Error determining search category:", err);
        return 'Electronics';
      }
    };

    // Use a debounce to avoid excessive API calls
    console.log(`useZincSearch: Setting up debounced search for "${searchTerm}" (800ms)`);
    searchTimeoutRef.current = window.setTimeout(() => {
      fetchZincResults().catch(err => {
        console.error('useZincSearch: Unhandled error in search', err);
        setLoading(false);
        isSearchingRef.current = false;
        searchStartTimeRef.current = null;
      });
    }, 800); // increased debounce time for better performance

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
