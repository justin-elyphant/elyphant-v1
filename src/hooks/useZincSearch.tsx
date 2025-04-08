
import { useState, useEffect, useRef } from "react";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { useProducts } from "@/contexts/ProductContext";

export const useZincSearch = (searchTerm: string) => {
  const [loading, setLoading] = useState(false);
  const [zincResults, setZincResults] = useState<any[]>([]);
  const { products } = useProducts();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchRequestIdRef = useRef<number>(0);
  const previousSearchTermRef = useRef<string>("");

  // Get local store products that match searchTerm
  const filteredProducts = searchTerm.trim().length <= 2 ? [] : 
    products
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .slice(0, 10);

  // Search Zinc API when searchTerm changes with improved debouncing
  useEffect(() => {
    // Don't trigger search if term is too short or hasn't changed
    if (searchTerm.trim().length <= 2 || searchTerm === previousSearchTermRef.current) {
      return;
    }
    
    // Update previous search term
    previousSearchTermRef.current = searchTerm;
    
    setLoading(true);
    
    // Clear any pending timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Create a unique ID for this search request
    const currentRequestId = ++searchRequestIdRef.current;
    
    // Set a timeout to avoid excessive API calls
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log("Searching for products with term:", searchTerm);
        // Only proceed if this is still the most recent request
        if (currentRequestId === searchRequestIdRef.current) {
          const results = await searchProducts(searchTerm);
          console.log("Search results:", results);
          // Only update state if this is still the most recent request
          if (currentRequestId === searchRequestIdRef.current) {
            // Handle the Zinc API response format
            if (results && Array.isArray(results)) {
              // Map the Zinc API response to match our expected format
              const formattedResults = results.map((item, index) => ({
                product_id: item.product_id,
                title: item.title || "Product",
                price: typeof item.price === 'number' ? item.price / 100 : parseFloat(item.price),
                image: item.image,
                description: item.description || "",
                brand: item.brand || "Unknown",
                category: item.category || "Electronics",
                retailer: "Amazon via Zinc",
                rating: item.rating || 0,
                review_count: item.review_count || 0,
                isBestSeller: item.isBestSeller || (index < Math.ceil(results.length * 0.1)) // Top 10% are best sellers
              }));
              
              setZincResults(formattedResults.slice(0, 12));
            } else {
              setZincResults([]);
            }
          }
        }
      } catch (error) {
        console.error("Error searching Zinc API:", error);
        setZincResults([]);
      } finally {
        if (currentRequestId === searchRequestIdRef.current) {
          setLoading(false);
        }
      }
    }, 300);
    
    // Cleanup timeout on unmount or when searchTerm changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, products]);

  // Determine if we have any results to show
  const hasResults = zincResults.length > 0 || filteredProducts.length > 0;

  return {
    loading,
    zincResults,
    filteredProducts,
    hasResults
  };
};
