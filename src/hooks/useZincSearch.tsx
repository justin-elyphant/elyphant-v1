
import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { toast } from 'sonner';
import { normalizeProduct } from '@/contexts/ProductContext';
import { searchMockProducts, getZincMockProducts } from '@/components/marketplace/services/mockProductService';

// Maximum results to prevent performance issues
const MAX_RESULTS = 20;

export const useZincSearch = (searchTerm: string) => {
  const [loading, setLoading] = useState(false);
  const [zincResults, setZincResults] = useState<any[]>([]);
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const searchTimeoutRef = useRef<number | null>(null);
  const lastSearchTermRef = useRef<string>("");
  const isSearchingRef = useRef(false);

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
    
    const fetchMockResults = async () => {
      if (isSearchingRef.current) return;
      
      try {
        // Mark search as started
        isSearchingRef.current = true;
        setLoading(true);
        console.log(`useZincSearch: Starting search for "${searchTerm}"`);
        
        // Filter local products first (faster response)
        const term = searchTerm.toLowerCase().trim();
        console.log(`useZincSearch: Filtering local products for "${term}"`);
        
        // Use more efficient filtering with early returns
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

        // Special case mappings for popular searches
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
        
        console.log(`useZincSearch: Using mock data for search "${searchQuery}"`);
        
        // Get mock data results
        const mockResults = getZincMockProducts(searchQuery);
        
        // Process results
        if (mockResults && Array.isArray(mockResults) && mockResults.length > 0) {
          console.log(`useZincSearch: Found ${mockResults.length} mock results for "${searchQuery}"`);
          
          // Map to consistent format with proper types
          const processedResults = mockResults
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
                  category: item.category || 'Electronics',
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
        } else {
          console.log(`useZincSearch: No results found for "${searchTerm}"`);
          setZincResults([]);
        }
        
      } catch (error) {
        console.error('useZincSearch: Error searching:', error);
      } finally {
        setLoading(false);
        console.log(`useZincSearch: Search completed for "${searchTerm}"`);
        
        // Add a slight delay before allowing new searches
        setTimeout(() => {
          isSearchingRef.current = false;
        }, 100);
      }
    };

    // Use a debounce to avoid excessive searches
    console.log(`useZincSearch: Setting up debounced search for "${searchTerm}" (500ms)`);
    searchTimeoutRef.current = window.setTimeout(() => {
      fetchMockResults().catch(err => {
        console.error('useZincSearch: Unhandled error in search', err);
        setLoading(false);
        isSearchingRef.current = false;
      });
    }, 500);

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
