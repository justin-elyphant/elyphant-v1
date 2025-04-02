
import { useEffect } from "react";
import { useProducts } from "@/contexts/ProductContext";
import { useShopifyConnection } from "./useShopifyConnection";
import { useShopifySync } from "./useShopifySync";
import { SyncSettings } from "./types";

export { SyncSettings };

export const useShopifyIntegration = () => {
  const { products } = useProducts();
  
  const {
    shopifyUrl,
    isConnected,
    isLoading: connectionLoading,
    lastSyncTime,
    setLastSyncTime,
    handleConnect,
    handleDisconnect
  } = useShopifyConnection();
  
  const {
    syncSettings,
    isLoading: syncLoading,
    handleSyncNow,
    handleSyncSettingChange,
    loadShopifyProductsToState
  } = useShopifySync(isConnected, lastSyncTime, setLastSyncTime);
  
  // Combine loading states
  const isLoading = connectionLoading || syncLoading;
  
  // Load saved products if connected
  useEffect(() => {
    if (isConnected) {
      loadShopifyProductsToState();
    }
  }, [isConnected, loadShopifyProductsToState]);

  return {
    shopifyUrl,
    isConnected,
    isLoading,
    syncSettings,
    products,
    lastSyncTime,
    handleConnect,
    handleDisconnect,
    handleSyncNow,
    handleSyncSettingChange,
    loadShopifyProducts: loadShopifyProductsToState
  };
};
