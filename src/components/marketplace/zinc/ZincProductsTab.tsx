
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

  // Format products for ZincProductResults component
  const formatProductsForResults = (products: Product[]) => {
    return products.map(product => ({
      id: product.id ? parseInt(product.id) : Math.floor(Math.random() * 10000),
      name: product.name || product.title || "Unknown Product",
      price: product.price || 0,
      image: product.image || "/placeholder.svg",
      description: product.description || product.product_description || "",
      rating: product.rating || product.stars || 0
    }));
  };

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
      
      {specialCaseProducts && specialCaseProducts.length > 0 && (
        <ZincProductResults
          products={formatProductsForResults(specialCaseProducts)}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />
      )}
      
      {marketplaceProducts && marketplaceProducts.length > 0 && (
        <ZincProductResults
          products={formatProductsForResults(marketplaceProducts)}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />
      )}
    </div>
  );
};

export default ZincProductsTab;
