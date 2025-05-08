
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { searchMockProducts } from "./services/mockProductService";

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
  
  // Initial load based on URL search parameter
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
      handleSearch(searchParam);
    } else {
      // Load some default products
      const defaultMockProducts = searchMockProducts("gift ideas", 8);
      setProducts(defaultMockProducts);
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
      
      {!searchTerm && (
        <GiftingCategories />
      )}
      
      <MarketplaceContent 
        products={products}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default MarketplaceWrapper;
