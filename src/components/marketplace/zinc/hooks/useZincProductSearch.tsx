
import { useState } from "react";
import { useZincSearch } from "./useZincSearch";
import { useProducts } from "@/contexts/ProductContext";
import { ZincProduct } from "../types";
import { convertZincProductToProduct } from "../utils/productConverter";

export const useZincProductSearch = () => {
  const { search, isLoading, error, searchTerm, setSearchTerm } = useZincSearch();
  const { setProducts } = useProducts();

  // Combined handleSearch that uses the search hook but also updates the product context
  const handleSearch = async (term: string) => {
    const results = await search(term);
    
    // Update products in context
    if (results.length > 0) {
      setProducts(prevProducts => {
        // Filter out any existing Amazon products
        const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc" && p.vendor !== "Elyphant");
        
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
    handleSearch,
    isLoading,
    error
  };
};
