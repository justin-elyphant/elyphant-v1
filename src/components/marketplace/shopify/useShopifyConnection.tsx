
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";
import { 
  loadShopifyConnection, 
  saveShopifyConnection,
  connectToShopify,
  fetchShopifyProducts
} from "./shopifyUtils";
import { SyncSettings } from "./types";

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
  
  const handleConnect = async (url: string) => {
    if (!url) {
      toast.error("Please enter a valid Shopify store URL");
      return;
    }
    
    setIsLoading(true);
    setShopifyUrl(url);
    
    try {
      // Connect to the store
      const result = await connectToShopify(url);
      
      if (result.success) {
        setIsConnected(true);
        const now = new Date();
        setLastSyncTime(now);
        
        // Save connection info to localStorage
        saveShopifyConnection({
          url,
          connected: true,
          syncTime: now.toISOString()
        });
        
        // Fetch products (real API call in production)
        const defaultSyncSettings: SyncSettings = {
          autoSync: true,
          markup: 30,
          importImages: true,
          importVariants: true
        };
        
        const shopifyProducts = await fetchShopifyProducts(url, defaultSyncSettings);
        
        if (shopifyProducts) {
          // Save products to state and localStorage
          setProducts(shopifyProducts);
          localStorage.setItem('shopifyProducts', JSON.stringify(shopifyProducts));
          
          toast.success("Shopify store connected successfully! We've imported your catalog.");
        } else {
          toast.warning("Connected to Shopify, but couldn't fetch products. Try syncing manually.");
        }
      } else {
        toast.error(result.message || "Failed to connect to Shopify store");
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error connecting to Shopify:", error);
      toast.error("An unexpected error occurred while connecting to Shopify");
    } finally {
      setIsLoading(false);
    }
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
