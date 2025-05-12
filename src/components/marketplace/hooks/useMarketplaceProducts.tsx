
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Product } from "@/types/product";
import { handleSearch, clearSearchOperations } from "./utils/searchOperations";
import { loadPersonalizedProducts } from "./utils/personalizationUtils";

export const useMarketplaceProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { profile } = useProfile();
  const searchIdRef = useRef<string>("");
  
  // Initial load based on URL search parameter
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
      const personId = searchParams.get("personId");
      const occasionType = searchParams.get("occasionType");
      
      // Generate unique ID for this search to prevent duplicate toasts
      const searchId = `search-${searchParam}-${Date.now()}`;
      searchIdRef.current = searchId;
      
      handleSearch(searchParam, personId, occasionType, searchIdRef, setIsLoading, setProducts);
    } else {
      // Load some default products with personalization
      const userInterests = profile?.gift_preferences || [];
      const interests = Array.isArray(userInterests) 
        ? userInterests.map(pref => typeof pref === 'string' ? pref : pref.category)
        : [];
      
      loadPersonalizedProducts(interests, setIsLoading, setProducts, products.length);
    }
    
    // Cleanup function to clear search operations when component unmounts
    return () => {
      clearSearchOperations();
    };
  }, []);

  // Watch for search parameter changes - using useEffect with searchParams dependency
  // This is optimized to prevent duplicate searches
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam && searchParam !== searchTerm) {
      setSearchTerm(searchParam);
      
      // Generate unique ID for this search to prevent duplicate toasts
      const searchId = `search-${searchParam}-${Date.now()}`;
      searchIdRef.current = searchId;
      
      handleSearch(searchParam, searchParams.get("personId"), searchParams.get("occasionType"), searchIdRef, setIsLoading, setProducts);
    }
  }, [searchParams]);
  
  // Handle search submission
  const onSearch = (term: string) => {
    if (!term.trim()) return;
    
    // Update URL parameter
    const params = new URLSearchParams(searchParams);
    params.set("search", term);
    // Clear personId and occasionType since this is a direct search
    params.delete("personId");
    params.delete("occasionType");
    setSearchParams(params);
    
    // Generate unique ID for this search
    const searchId = `search-${term}-${Date.now()}`;
    searchIdRef.current = searchId;
    
    // Directly handle search
    handleSearch(term, null, null, searchIdRef, setIsLoading, setProducts);
  };

  return { 
    searchTerm, 
    setSearchTerm, 
    isLoading, 
    products,
    onSearch
  };
};
