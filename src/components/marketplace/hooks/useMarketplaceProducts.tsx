
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { getMockProducts, searchMockProducts } from "../services/mockProductService";
import { toast } from "sonner";

// Default search terms to load if no query is provided
const DEFAULT_SEARCH_TERMS = ["gift ideas", "popular gifts", "trending products"];

export const useMarketplaceProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading: contextLoading, setProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Ensure we always load products on initial render
  useEffect(() => {
    console.log("useMarketplaceProducts: Initial load effect running");
    const loadInitialProducts = async () => {
      const keyword = searchParams.get("search") || "";
      setSearchTerm(keyword);
      setLocalSearchTerm(keyword);
      
      // Set initial loading state
      setIsSearching(true);
      
      try {
        // Load products based on search term or default
        if (keyword) {
          console.log("Loading products for search term:", keyword);
          const mockResults = searchMockProducts(keyword);
          console.log(`Found ${mockResults.length} products for "${keyword}"`);
          
          if (mockResults.length === 0) {
            console.log("No search results, using default products");
            setProducts(getMockProducts(12));
          } else {
            setProducts(mockResults);
          }
        } else {
          // Select a random default search term
          const defaultTerm = DEFAULT_SEARCH_TERMS[Math.floor(Math.random() * DEFAULT_SEARCH_TERMS.length)];
          console.log("Loading default products for:", defaultTerm);
          const mockResults = getMockProducts(12);
          console.log(`Found ${mockResults.length} default products`);
          setProducts(mockResults);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        // Ensure we have some products even if there's an error
        setProducts(getMockProducts(6));
        toast.error("Error loading products");
      } finally {
        // Complete loading after a short delay for a smoother UX
        setTimeout(() => {
          setIsSearching(false);
          setInitialLoadComplete(true);
        }, 300);
      }
    };

    loadInitialProducts();
  }, []); // Only run once on component mount

  // Handle search term changes from URL
  useEffect(() => {
    const urlSearchTerm = searchParams.get("search") || "";
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
      setLocalSearchTerm(urlSearchTerm);
      
      // Only trigger a new search if the term actually changed
      if (urlSearchTerm) {
        setIsSearching(true);
        
        setTimeout(() => {
          const results = searchMockProducts(urlSearchTerm);
          
          if (results.length === 0) {
            setProducts(getMockProducts(5));
          } else {
            setProducts(results);
          }
          
          setIsSearching(false);
        }, 300);
      }
    }
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
      }, 300);
    }
  };

  return {
    searchTerm,
    localSearchTerm,
    setLocalSearchTerm,
    handleSearch,
    isLoading: contextLoading || isSearching,
    initialLoadComplete,
    products
  };
};
