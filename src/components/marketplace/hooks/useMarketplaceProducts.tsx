
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { getMockProducts, searchMockProducts } from "../services/mockProductService";
import { GiftOccasion } from "../utils/upcomingOccasions";

// Default search terms to load if no query is provided
const DEFAULT_SEARCH_TERMS = ["gift ideas", "popular gifts", "trending products"];

export const useMarketplaceProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading, setProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Ensure we always load products on initial render and when search changes
  useEffect(() => {
    const keyword = searchParams.get("search") || "";
    setSearchTerm(keyword);
    setLocalSearchTerm(keyword);
    
    // Load products with the keyword from URL or use default search if empty
    setIsSearching(true);
    
    // Force a small delay to allow the UI to show the loading state
    setTimeout(() => {
      if (keyword) {
        // Use mock products with search
        console.log("MarketplaceWrapper: Loading products for search term:", keyword);
        const mockResults = searchMockProducts(keyword);
        console.log(`MarketplaceWrapper: Found ${mockResults.length} products for "${keyword}"`);
        
        // Always ensure we have some products
        if (mockResults.length === 0) {
          console.log("MarketplaceWrapper: No search results, using default products");
          setProducts(getMockProducts());
        } else {
          setProducts(mockResults);
        }
      } else {
        // Select a random default search term to load initial products
        const defaultTerm = DEFAULT_SEARCH_TERMS[Math.floor(Math.random() * DEFAULT_SEARCH_TERMS.length)];
        console.log("MarketplaceWrapper: Loading default products for:", defaultTerm);
        const mockResults = getMockProducts();
        console.log(`MarketplaceWrapper: Found ${mockResults.length} default products`);
        setProducts(mockResults);
      }
      
      // Always complete loading after a short delay
      setTimeout(() => {
        setIsSearching(false);
        setInitialLoadComplete(true);
      }, 200); // Shorter delay for faster loading perception
    }, 100);
  }, [searchParams, setProducts]);

  const handleSearch = (term: string) => {
    if (term.trim()) {
      setIsSearching(true);
      const params = new URLSearchParams(searchParams);
      params.set("search", term);
      setSearchParams(params);
      
      // Simulate search delay for a more realistic experience
      setTimeout(() => {
        const results = searchMockProducts(term);
        
        // Always ensure we have at least some products
        if (results.length === 0) {
          setProducts(getMockProducts(5));
        } else {
          setProducts(results);
        }
        
        setIsSearching(false);
      }, 300); // Shorter delay for better UX
    }
  };

  return {
    searchTerm,
    localSearchTerm,
    setLocalSearchTerm,
    handleSearch,
    isLoading: isLoading || isSearching,
    initialLoadComplete,
    products
  };
};
