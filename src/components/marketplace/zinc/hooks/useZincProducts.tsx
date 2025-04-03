import { useState } from "react";
import { useZincSearch } from "./useZincSearch";
import { useZincProductSync } from "./useZincProductSync";
import { useProducts } from "@/contexts/ProductContext";

export const useZincProducts = () => {
  const { search, isLoading: isSearchLoading, error: searchError, searchTerm, setSearchTerm } = useZincSearch();
  const { setProducts } = useProducts();
  
  // For the useZincProductSync hook, we'll provide an updateLastSync function
  const updateLastSync = () => {
    // In a real implementation, this would update the last sync time in the context or localStorage
    const connection = JSON.parse(localStorage.getItem("zincConnection") || "{}");
    connection.lastSync = Date.now();
    localStorage.setItem("zincConnection", JSON.stringify(connection));
  };
  
  const { syncProducts, isLoading: isSyncLoading, error: syncError } = useZincProductSync(updateLastSync);

  // Combined handleSearch that uses the search hook but also updates the product context
  const handleSearch = async (term: string) => {
    const results = await search(term);
    
    // Update products in context
    if (results.length > 0) {
      setProducts(prevProducts => {
        // Filter out any existing Amazon products
        const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc");
        // Add the new Amazon products
        return [...nonAmazonProducts, ...results];
      });
    }
    
    return results;
  };

  return {
    searchTerm,
    setSearchTerm,
    syncProducts,
    handleSearch,
    isLoading: isSearchLoading || isSyncLoading,
    error: searchError || syncError
  };
};
