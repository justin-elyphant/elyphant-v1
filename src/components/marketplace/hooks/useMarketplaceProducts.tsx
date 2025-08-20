import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Product } from "@/types/product";
import { handleSearch, handleMultiInterestSearch, clearSearchOperations } from "./utils/searchOperations";
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
      const multiInterest = searchParams.get("multi_interest");
      
      // Extract Nicole context from URL parameters
      const minPrice = searchParams.get("minPrice");
      const maxPrice = searchParams.get("maxPrice");
      const source = searchParams.get("source");
      const recipient = searchParams.get("recipient");
      const occasion = searchParams.get("occasion");
      
      console.log('🎯 Marketplace useEffect: URL parameters received:', {
        searchParam,
        minPrice,
        maxPrice,
        source,
        recipient,
        occasion,
        personId,
        occasionType,
        multiInterest
      });
      
      // Build Nicole context if available
      const nicoleContext = source === 'nicole' ? {
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        recipient,
        occasion,
        budget: (minPrice && maxPrice) ? [Number(minPrice), Number(maxPrice)] : undefined
      } : undefined;
      
      console.log('🎯 Marketplace: Extracted Nicole context from URL:', nicoleContext);
      
      // Generate unique ID for this search to prevent duplicate toasts
      const searchId = `search-${searchParam}-${Date.now()}`;
      searchIdRef.current = searchId;
      
      // Check if this is a multi-interest search
      if (multiInterest === 'true') {
        // Split the search term back into individual interests
        const interests = searchParam.split(' ').filter(term => term.length > 0);
        console.log('🎯 Marketplace: Detected multi-interest search for:', interests);
        handleMultiInterestSearch(interests, searchIdRef, setIsLoading, setProducts);
      } else {
        handleSearch(searchParam, searchIdRef, setIsLoading, setProducts, personId, occasionType, false, nicoleContext);
      }
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
    const multiInterest = searchParams.get("multi_interest");
    
    if (searchParam && searchParam !== searchTerm) {
      setSearchTerm(searchParam);
      
      // Extract Nicole context from URL parameters
      const minPrice = searchParams.get("minPrice");
      const maxPrice = searchParams.get("maxPrice");
      const source = searchParams.get("source");
      const recipient = searchParams.get("recipient");
      const occasion = searchParams.get("occasion");
      
      // Build Nicole context if available
      const nicoleContext = source === 'nicole' ? {
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        recipient,
        occasion,
        budget: (minPrice && maxPrice) ? [Number(minPrice), Number(maxPrice)] : undefined
      } : undefined;
      
      // Generate unique ID for this search to prevent duplicate toasts
      const searchId = `search-${searchParam}-${Date.now()}`;
      searchIdRef.current = searchId;
      
      // Check if this is a multi-interest search
      if (multiInterest === 'true') {
        // Split the search term back into individual interests
        const interests = searchParam.split(' ').filter(term => term.length > 0);
        console.log('🎯 Marketplace: Detected multi-interest search for:', interests);
        handleMultiInterestSearch(interests, searchIdRef, setIsLoading, setProducts);
      } else {
        handleSearch(searchParam, searchIdRef, setIsLoading, setProducts, searchParams.get("personId"), searchParams.get("occasionType"), false, nicoleContext);
      }
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
    // Clear Nicole context since this is a manual search
    params.delete("source");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("recipient");
    params.delete("occasion");
    setSearchParams(params);
    
    // Generate unique ID for this search
    const searchId = `search-${term}-${Date.now()}`;
    searchIdRef.current = searchId;
    
    // Directly handle search
    handleSearch(term, searchIdRef, setIsLoading, setProducts, null, null);
  };

  return { 
    searchTerm, 
    setSearchTerm, 
    isLoading, 
    products,
    onSearch
  };
};