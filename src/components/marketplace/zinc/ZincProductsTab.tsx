
import React, { useEffect } from "react";
import { useZincProductSearch } from "./hooks/useZincProductSearch";
import { ZincSearchForm } from "./components/ZincSearchForm";
import { ZincProductResults } from "./components/ZincProductResults";

const ZincProductsTab = () => {
  const { 
    searchTerm, 
    setSearchTerm,
    localSearchTerm, 
    setLocalSearchTerm,
    handleSearch,
    syncProducts,
    isLoading,
    marketplaceProducts
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
      
      <ZincProductResults
        products={marketplaceProducts}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default ZincProductsTab;
