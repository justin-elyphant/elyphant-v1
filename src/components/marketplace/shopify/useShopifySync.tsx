
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";
import { SyncSettings } from "./types";
import { loadShopifyProducts, saveShopifyConnection } from "./shopifyUtils";

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
  
  const handleSyncNow = () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const now = new Date();
      setLastSyncTime(now);
      
      // Add any new sync actions here
      loadShopifyProductsToState();
      
      const connection = JSON.parse(localStorage.getItem('shopifyConnection') || '{}');
      saveShopifyConnection({
        ...connection,
        syncTime: now.toISOString()
      });
      
      toast.success("Product sync completed. Your catalog is up to date.");
    }, 1500);
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
