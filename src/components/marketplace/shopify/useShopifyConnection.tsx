import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";
import { 
  loadShopifyConnection, 
  saveShopifyConnection, 
  generateMockShopifyProducts 
} from "./shopifyUtils";

export const useShopifyConnection = () => {
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const { setProducts } = useProducts();
  
  // Load saved connection on mount
  useEffect(() => {
    const connection = loadShopifyConnection();
    if (connection) {
      setShopifyUrl(connection.url || "");
      setIsConnected(connection.connected || false);
      setLastSyncTime(connection.syncTime ? new Date(connection.syncTime) : null);
    }
  }, []);
  
  const handleConnect = (url: string) => {
    if (!url) {
      toast.error("Please enter a valid Shopify store URL");
      return;
    }
    
    setIsLoading(true);
    setShopifyUrl(url);
    
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      const now = new Date();
      setLastSyncTime(now);
      
      // Save connection info to localStorage
      saveShopifyConnection({
        url,
        connected: true,
        syncTime: now.toISOString()
      });
      
      // Create mock Shopify products
      const shopifyProducts = generateMockShopifyProducts();
      
      // Save products to state and localStorage
      setProducts(shopifyProducts);
      localStorage.setItem('shopifyProducts', JSON.stringify(shopifyProducts));
      
      toast.success("Shopify store connected successfully! We've imported your catalog.");
    }, 1500);
  };
  
  const handleDisconnect = () => {
    setIsConnected(false);
    setShopifyUrl("");
    setLastSyncTime(null);
    
    // Clear shopify connection but keep products for reference
    localStorage.removeItem('shopifyConnection');
    
    toast.info("Shopify store disconnected");
  };
  
  return {
    shopifyUrl,
    isConnected,
    isLoading,
    lastSyncTime,
    setLastSyncTime,
    handleConnect,
    handleDisconnect
  };
};
