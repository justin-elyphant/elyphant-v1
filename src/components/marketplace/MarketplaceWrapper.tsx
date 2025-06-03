
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import MarketplaceContent from "./MarketplaceContent";
import { useMarketplaceSearch } from "./hooks/useMarketplaceSearch";
import { handleBrandProducts } from "@/utils/brands/brandHandler";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ZincProductsTab from "./zinc/ZincProductsTab";
import OptimizationDashboard from "./OptimizationDashboard";

const MarketplaceWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { products, setProducts } = useProducts();
  const [showFilters, setShowFilters] = useState(false);
  
  // Get marketplace search functionality
  const {
    currentCategory,
    filteredProducts,
    isLoading,
    getPageInfo
  } = useMarketplaceSearch();

  // Handle brand-specific searches
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brandParam = params.get("brand");
    
    if (brandParam && brandParam.trim()) {
      console.log(`MarketplaceWrapper: Handling brand search for: ${brandParam}`);
      handleBrandProducts(brandParam, products, setProducts);
    }
  }, [location.search, products, setProducts]);

  const handleProductView = (productId: string) => {
    console.log(`Viewing product: ${productId}`);
  };

  // Get active tab from URL
  const params = new URLSearchParams(location.search);
  const activeTab = params.get("tab") || "products";
  const searchTerm = params.get("search");

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set("tab", value);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="search">Search Tools</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <MarketplaceContent
            products={filteredProducts}
            isLoading={isLoading}
            searchTerm={searchTerm || undefined}
            onProductView={handleProductView}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        </TabsContent>
        
        <TabsContent value="search" className="mt-6">
          <ZincProductsTab />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <OptimizationDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplaceWrapper;
