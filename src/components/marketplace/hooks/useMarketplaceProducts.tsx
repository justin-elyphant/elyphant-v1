import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Product } from "@/types/product";
import { handleSearch, clearSearchOperations } from "./utils/searchOperations";
import { loadPersonalizedProducts } from "./utils/personalizationUtils";
import { directNicoleMarketplaceService } from "@/services/marketplace/DirectNicoleMarketplaceService";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";

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
      
      // **ENHANCED NICOLE-AWARE SEARCH: Use enhanced service directly with Nicole context**
      console.log('🎯 ENHANCED: Using Nicole-aware enhanced search for all requests');
      setIsLoading(true);
      
      // Extract price filters from Nicole context for enhanced service
      const priceFilters = nicoleContext ? {
        minPrice: nicoleContext.minPrice || nicoleContext.budget?.[0],
        maxPrice: nicoleContext.maxPrice || nicoleContext.budget?.[1]
      } : {};
      
      console.log('🎯 ENHANCED: Calling enhanced service with Nicole context:', { nicoleContext, priceFilters });
      
      enhancedZincApiService.searchProducts(
        searchParam,
        1,
        35,
        priceFilters
      ).then(enhancedResults => {
        console.log(`🎯 ENHANCED: Enhanced service returned ${enhancedResults.results?.length || 0} results`);
        console.log(`🎯 ENHANCED: Result source: ${enhancedResults.source || 'zinc-api'}`);
        
        setProducts(enhancedResults.results || []);
        setIsLoading(false);
        
        if (enhancedResults.error) {
          console.log(`ℹ️ ENHANCED: Service note: ${enhancedResults.error}`);
        }
      }).catch(error => {
        console.error('🎯 ENHANCED: Enhanced service failed:', error);
        setProducts([]);
        setIsLoading(false);
      });
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
      
      // **ENHANCED NICOLE-AWARE SEARCH: Use enhanced service directly with Nicole context (param change)**
      console.log('🎯 ENHANCED: Using Nicole-aware enhanced search for param change');
      setIsLoading(true);
      
      // Extract price filters from Nicole context for enhanced service
      const priceFilters = nicoleContext ? {
        minPrice: nicoleContext.minPrice || nicoleContext.budget?.[0],
        maxPrice: nicoleContext.maxPrice || nicoleContext.budget?.[1]
      } : {};
      
      console.log('🎯 ENHANCED: Calling enhanced service with Nicole context (param change):', { nicoleContext, priceFilters });
      
      enhancedZincApiService.searchProducts(
        searchParam,
        1,
        35,
        priceFilters
      ).then(enhancedResults => {
        console.log(`🎯 ENHANCED: Enhanced service returned ${enhancedResults.results?.length || 0} results (param change)`);
        console.log(`🎯 ENHANCED: Result source: ${enhancedResults.source || 'zinc-api'}`);
        
        setProducts(enhancedResults.results || []);
        setIsLoading(false);
        
        if (enhancedResults.error) {
          console.log(`ℹ️ ENHANCED: Service note: ${enhancedResults.error}`);
        }
      }).catch(error => {
        console.error('🎯 ENHANCED: Enhanced service failed (param change):', error);
        setProducts([]);
        setIsLoading(false);
      });
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