import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { searchProducts } from '@/components/marketplace/zinc/zincService';
import { toast } from 'sonner';

export const useZincSearch = (searchTerm: string) => {
  const [loading, setLoading] = useState(false);
  const [zincResults, setZincResults] = useState<any[]>([]);
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const toastRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
            (product.description && product.description.toLowerCase().includes(term))
        );
        setFilteredProducts(filtered);
        
        // Now search Zinc API
        console.log(`Searching Zinc API for "${searchTerm}"...`);
        
        // Get results from Zinc API (through our service)
        const results = await searchProducts(searchTerm);
        
        // Process results
        if (results && Array.isArray(results)) {
          console.log(`Found ${results.length} results from Zinc API for "${searchTerm}"`);
          console.log("Sample result with image data:", results[0]);
          
          // Map to consistent format - ensure we capture image URLs properly
          const processedResults = results.map(item => ({
            id: item.product_id,
            product_id: item.product_id,
            title: item.title,
            price: item.price,
            // Use image array if available, otherwise use single image, fallback to placeholder
            image: item.images?.[0] || item.image || "/placeholder.svg",
            images: item.images || (item.image ? [item.image] : ["/placeholder.svg"]),
            rating: item.rating || 0,
            stars: item.rating || 0, 
            review_count: item.review_count || 0,
            num_reviews: item.review_count || 0,
            brand: item.brand,
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
