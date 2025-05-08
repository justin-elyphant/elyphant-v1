
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
        let filtered = products
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
              
              // Also check for individual word matches
              const words = term.split(" ");
              if (words.length > 1) {
                return words.some(word => 
                  word.length > 2 && (
                    name.includes(word) || 
                    title.includes(word) || 
                    description.includes(word) || 
                    brand.includes(word)
                  )
                );
              }
              
              return false;
            } catch (err) {
              console.error("Error filtering product:", err);
              return false;
            }
          })
          .slice(0, MAX_RESULTS);
        
        console.log(`useZincSearch: Found ${filtered.length} matching local products`);
        
        // Get mock search results - this is the key part for searching
        console.log(`useZincSearch: Getting mock search results for "${searchTerm}"`);
        const mockResults = searchMockProducts(searchTerm, MAX_RESULTS);
        
        // Process results
        if (mockResults && mockResults.length > 0) {
          console.log(`useZincSearch: Found ${mockResults.length} mock results`);
          
          // Ensure each product has valid images
          const validatedResults = mockResults.map(product => {
            if (!product.image || product.image === "/placeholder.svg") {
              // Find a better image based on category or name
              const category = product.category?.toLowerCase() || "";
              const name = (product.name || product.title || "").toLowerCase();
              
              if (name.includes("nike") || category.includes("shoe") || category.includes("footwear")) {
                product.image = "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/7fbc5e94-8d49-4730-a280-f19d3cfad0b0/air-max-90-mens-shoes-6n3vKB.png";
              } else if (category.includes("electronics")) {
                product.image = "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&h=500&fit=crop";
              }
            }
            
            // Ensure images array exists
            if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
              product.images = product.image ? [product.image] : ['/placeholder.svg'];
            }
            
            return product;
          });
          
          setZincResults(validatedResults);
          
          // If we have mock results but no filtered results, use mock results as filtered
          if (filtered.length === 0) {
            console.log("useZincSearch: No local matches, using mock search results as filtered products");
            setFilteredProducts(validatedResults);
          } else {
            setFilteredProducts(filtered);
          }
        } else {
          console.log(`useZincSearch: No mock results found, using fallback`);
          // Fallback to some default products
          const fallbackProducts = getMockProducts(5);
          setZincResults(fallbackProducts);
          
          if (filtered.length === 0) {
            setFilteredProducts(fallbackProducts);
          } else {
            setFilteredProducts(filtered);
          }
        }
        
      } catch (error) {
        console.error('useZincSearch: Error searching:', error);
        // Fallback to default products on error
        const fallbackProducts = getMockProducts(5);
        setZincResults(fallbackProducts);
        setFilteredProducts(fallbackProducts);
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
