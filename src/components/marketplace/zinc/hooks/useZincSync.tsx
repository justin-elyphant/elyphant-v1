
import { useState } from "react";
import { useZincProductSync } from "./useZincProductSync";
import { ZincProduct } from "../types";
import { toast } from "@/hooks/use-toast";

/**
 * Hook for syncing products from Zinc API with UI feedback
 */
export const useZincSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const updateLastSync = () => {
    setLastSync(new Date());
  };
  
  // Use the product sync hook
  const { syncProducts: syncProductsBase } = useZincProductSync(updateLastSync);
  
  // Add UI feedback and loading state
  const syncProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Starting product sync from Zinc API");
      
      toast({
        title: "Syncing products",
        description: "Fetching latest products from Amazon..."
      });
      
      const products = await syncProductsBase();
      
      if (products.length > 0) {
        console.log(`Synced ${products.length} products successfully`);
        toast({
          title: "Sync completed",
          description: `Successfully synced ${products.length} products from Amazon`,
          variant: "default"
        });
        return products;
      } else {
        console.log("Sync returned zero products");
        toast({
          title: "Sync completed",
          description: "No new products found to sync",
          variant: "default"
        });
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sync products";
      console.error("Sync error:", errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    syncProducts,
    isLoading,
    error,
    lastSync
  };
};
