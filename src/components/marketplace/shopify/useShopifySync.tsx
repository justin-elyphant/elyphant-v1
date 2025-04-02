
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";
import { SyncSettings } from "./types";
import { loadShopifyProducts, saveShopifyConnection, fetchShopifyProducts } from "./shopifyUtils";

export const useShopifySync = (
  isConnected: boolean,
  lastSyncTime: Date | null,
  setLastSyncTime: (date: Date | null) => void
) => {
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    autoSync: true,
    markup: 30, // Default 30% markup
    importImages: true,
    importVariants: true,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { setProducts } = useProducts();
  
  // Load Shopify products from localStorage
  const loadShopifyProductsToState = useCallback(() => {
    const shopifyProducts = loadShopifyProducts();
    if (shopifyProducts && shopifyProducts.length > 0) {
      setProducts(shopifyProducts);
      console.log("Shopify products set in context:", shopifyProducts.length);
      return true;
    }
    return false;
  }, [setProducts]);
  
  const handleSyncNow = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      // Get connection details
      const connection = JSON.parse(localStorage.getItem('shopifyConnection') || '{}');
      
      if (!connection.url) {
        toast.error("No Shopify store URL found");
        setIsLoading(false);
        return;
      }
      
      // Real API call to fetch products
      const products = await fetchShopifyProducts(connection.url, syncSettings);
      
      if (products && products.length > 0) {
        // Save products to state and localStorage
        setProducts(products);
        localStorage.setItem('shopifyProducts', JSON.stringify(products));
        
        // Update sync time
        const now = new Date();
        setLastSyncTime(now);
        
        saveShopifyConnection({
          ...connection,
          syncTime: now.toISOString()
        });
        
        toast.success(`Product sync completed. Imported ${products.length} products.`);
      } else {
        toast.error("No products found or sync failed");
      }
    } catch (error) {
      console.error("Error during sync:", error);
      toast.error("Failed to sync products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSettingChange = (key: string, value: any) => {
    setSyncSettings({
      ...syncSettings,
      [key]: value
    });
    toast.success(`Updated ${key} setting`);
  };
  
  return {
    syncSettings,
    isLoading,
    handleSyncNow,
    handleSyncSettingChange,
    loadShopifyProductsToState
  };
};
