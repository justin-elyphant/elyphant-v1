
import React, { useEffect } from "react";
import { useZincProductSearch } from "./hooks/useZincProductSearch";
import { ZincSearchForm } from "./components/ZincSearchForm";
import { ZincProductResults } from "./components/ZincProductResults";
import { Product } from "@/types/product";

const ZincProductsTab = () => {
  const { 
    searchTerm, 
    setSearchTerm,
    localSearchTerm, 
    setLocalSearchTerm,
    handleSearch,
    syncProducts,
    isLoading,
    marketplaceProducts,
    specialCaseProducts
  } = useZincProductSearch();
  
  useEffect(() => {
    if (searchTerm && searchTerm !== localSearchTerm) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (localSearchTerm.trim()) {
      await handleSearch(localSearchTerm);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Format special case products to match the Product type
  const formattedSpecialCaseProducts: Product[] = specialCaseProducts.map((product, index) => ({
    id: `2000${index}`, // Convert to string
    name: product.title || "San Diego Padres Hat",
    price: product.price || 29.99,
    category: product.category || "Sports Merchandise",
    image: product.image || "https://images.unsplash.com/photo-1590075865003-e48b276c4579?w=500&h=500&fit=crop",
    vendor: "Amazon via Zinc",
    description: product.description || "Official San Diego Padres baseball cap. Show your team spirit with this authentic MLB merchandise.",
    rating: product.rating || 4.5,
    reviewCount: product.review_count || 120
  }));

  return (
    <div className="space-y-4 py-4">
      <ZincSearchForm
        searchTerm={localSearchTerm}
        setSearchTerm={setLocalSearchTerm}
        handleSubmit={handleSubmit}
        handleKeyDown={handleKeyDown}
        syncProducts={syncProducts}
        isLoading={isLoading}
      />
      
      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          Showing results for: "{searchTerm}"
        </p>
      )}
      
      {specialCaseProducts.length > 0 && (
        <ZincProductResults
          products={formattedSpecialCaseProducts}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />
      )}
      
      {marketplaceProducts && (
        <ZincProductResults
          products={marketplaceProducts}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />
      )}
    </div>
  );
};

export default ZincProductsTab;
