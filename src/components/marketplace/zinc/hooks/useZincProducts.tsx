
import { useState } from "react";
import { useZincSearch } from "./useZincSearch";
import { useZincProductSync } from "./useZincProductSync";
import { useProducts } from "@/contexts/ProductContext";
import { ZincProduct } from "../types";
import { Product } from "@/contexts/ProductContext";

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

  // Helper function to convert ZincProduct to Product
  const convertZincProductToProduct = (zincProduct: ZincProduct, index: number): Product => ({
    id: 1000 + index,
    name: zincProduct.title,
    price: zincProduct.price,
    category: zincProduct.category || "Electronics",
    image: zincProduct.image || "/placeholder.svg",
    vendor: "Amazon via Zinc",
    description: zincProduct.description || ""
  });

  // Combined handleSearch that uses the search hook but also updates the product context
  const handleSearch = async (term: string) => {
    const results = await search(term);
    
    // Update products in context
    if (results.length > 0) {
      setProducts(prevProducts => {
        // Filter out any existing Amazon products
        const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc");
        
        // Convert ZincProduct to Product format
        const amazonProducts = results.map(convertZincProductToProduct);
        
        // Add the new Amazon products
        return [...nonAmazonProducts, ...amazonProducts];
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
