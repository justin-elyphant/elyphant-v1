
import { useState } from "react";
import { useProducts } from "@/contexts/ProductContext";
import { useZincProductSync as useOriginalZincProductSync } from "./useZincProductSync";
import { convertZincProductToProduct } from "../utils/productConverter";

export const useZincSync = () => {
  const { setProducts } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  
  // For the useZincProductSync hook, we'll provide an updateLastSync function
  const updateLastSync = () => {
    // In a real implementation, this would update the last sync time in the context or localStorage
    const connection = JSON.parse(localStorage.getItem("zincConnection") || "{}");
    connection.lastSync = Date.now();
    localStorage.setItem("zincConnection", JSON.stringify(connection));
  };
  
  // Use the original sync hook
  const { syncProducts: syncZincProducts, error: syncError } = useOriginalZincProductSync(updateLastSync);

  // Wrapper for syncProducts that handles the type conversion
  const syncProducts = async () => {
    setIsLoading(true);
    
    try {
      const results = await syncZincProducts();
      
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
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncProducts,
    isLoading,
    error: syncError
  };
};
