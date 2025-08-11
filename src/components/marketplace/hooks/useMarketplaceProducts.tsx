import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Product } from "@/types/product";
import { handleSearch, clearSearchOperations } from "./utils/searchOperations";
import { loadPersonalizedProducts } from "./utils/personalizationUtils";
import { directNicoleMarketplaceService } from "@/services/marketplace/DirectNicoleMarketplaceService";

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
        occasionType
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
      
      // **PHASE 1 FIX: Use DirectNicole search when source=nicole**
      if (source === 'nicole' && nicoleContext) {
        console.log('🎯 PHASE 1: Using DirectNicole search for source=nicole');
        setIsLoading(true);
        
        directNicoleMarketplaceService.searchWithNicoleContext(
          searchParam,
          nicoleContext,
          { maxResults: 35 }
        ).then(nicoleResults => {
          console.log(`🎯 PHASE 1: DirectNicole returned ${nicoleResults.length} results`);
          setProducts(nicoleResults);
          setIsLoading(false);
        }).catch(error => {
          console.error('🎯 PHASE 1: DirectNicole search failed, falling back to standard search:', error);
          // Fallback to standard search
          const searchId = `search-${searchParam}-${Date.now()}`;
          searchIdRef.current = searchId;
          handleSearch(searchParam, searchIdRef, setIsLoading, setProducts, personId, occasionType, false, nicoleContext);
        });
      } else {
        // Generate unique ID for this search to prevent duplicate toasts
        const searchId = `search-${searchParam}-${Date.now()}`;
        searchIdRef.current = searchId;
        
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
      
      // **PHASE 1 FIX: Use DirectNicole search when source=nicole**
      if (source === 'nicole' && nicoleContext) {
        console.log('🎯 PHASE 1: Using DirectNicole search for source=nicole (param change)');
        setIsLoading(true);
        
        directNicoleMarketplaceService.searchWithNicoleContext(
          searchParam,
          nicoleContext,
          { maxResults: 35 }
        ).then(nicoleResults => {
          console.log(`🎯 PHASE 1: DirectNicole returned ${nicoleResults.length} results`);
          setProducts(nicoleResults);
          setIsLoading(false);
        }).catch(error => {
          console.error('🎯 PHASE 1: DirectNicole search failed, falling back to standard search:', error);
          // Fallback to standard search
          const searchId = `search-${searchParam}-${Date.now()}`;
          searchIdRef.current = searchId;
          handleSearch(searchParam, searchIdRef, setIsLoading, setProducts, searchParams.get("personId"), searchParams.get("occasionType"), false, nicoleContext);
        });
      } else {
        // Generate unique ID for this search to prevent duplicate toasts
        const searchId = `search-${searchParam}-${Date.now()}`;
        searchIdRef.current = searchId;
        
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