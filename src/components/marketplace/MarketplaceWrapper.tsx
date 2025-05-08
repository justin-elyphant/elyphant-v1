
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { searchMockProducts } from "./services/mockProductService";
import { useProfile } from "@/contexts/profile/ProfileContext";

import MarketplaceHeader from "./MarketplaceHeader";
import GiftingCategories from "./GiftingCategories";
import MarketplaceContent from "./MarketplaceContent";
import { Product } from "@/types/product";
import { normalizeProduct } from "@/contexts/ProductContext";
import { toast } from "sonner";

const MarketplaceWrapper = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { profile } = useProfile();
  
  // Initial load based on URL search parameter
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
      handleSearch(searchParam);
    } else {
      // Load some default products with personalization
      loadPersonalizedProducts();
    }
  }, []);
  
  // Watch for search parameter changes
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam && searchParam !== searchTerm) {
      setSearchTerm(searchParam);
      handleSearch(searchParam);
    }
  }, [searchParams]);

  // Load personalized products based on user profile
  const loadPersonalizedProducts = () => {
    setIsLoading(true);
    
    // Extract user interests from profile
    const userInterests = profile?.gift_preferences || [];
    const interests = Array.isArray(userInterests) 
      ? userInterests.map(pref => typeof pref === 'string' ? pref : pref.category)
      : [];

    console.log("User interests for personalization:", interests);

    let personalizedProducts: Product[] = [];
    
    // If we have interests, use them for personalized results
    if (interests.length > 0) {
      // Use up to 3 interests to create a personalized mix of products
      const personalizedQuery = interests.slice(0, 3).join(" ");
      personalizedProducts = searchMockProducts(personalizedQuery, 10);
      
      // Mix in some general products
      const generalProducts = searchMockProducts("gift ideas", 6);
      
      // Combine and shuffle to create a diverse but personalized selection
      personalizedProducts = [...personalizedProducts.slice(0, 10), ...generalProducts.slice(0, 6)]
        .sort(() => Math.random() - 0.5); // Simple shuffle
      
      console.log(`Generated ${personalizedProducts.length} personalized products based on interests`);
    } else {
      // Fallback to default products if no interests
      personalizedProducts = searchMockProducts("gift ideas", 16);
      console.log("No interests found, using default products");
    }
    
    setProducts(personalizedProducts);
    setIsLoading(false);
  };
  
  // Handle search function
  const handleSearch = (term: string) => {
    setIsLoading(true);
    console.log(`MarketplaceWrapper: Searching for "${term}"`);
    
    try {
      // Generate mock search results
      const mockResults = searchMockProducts(term, 16);
      
      // Update products state
      setProducts(mockResults);
      
      console.log(`MarketplaceWrapper: Found ${mockResults.length} results for "${term}"`);
      
      // Show success toast only for significant searches
      if (term.length > 3) {
        toast.success(`Found ${mockResults.length} products for "${term}"`);
      }
    } catch (error) {
      console.error('Error searching for products:', error);
      toast.error('Error searching for products');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search submission
  const onSearch = (term: string) => {
    if (!term.trim()) return;
    
    // Update URL parameter
    const params = new URLSearchParams(searchParams);
    params.set("search", term);
    setSearchParams(params);
    
    // Directly handle search
    handleSearch(term);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <MarketplaceHeader 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onSearch={onSearch} 
      />
      
      {/* Compact categories section always visible */}
      <GiftingCategories />
      
      <MarketplaceContent 
        products={products}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default MarketplaceWrapper;
