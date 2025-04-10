
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";
import { fetchProductDetails } from "../services/productDetailsService";
import { setZincApiToken, getZincApiToken, clearZincApiToken } from "../zincCore";

export const useZincConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [enableAutoFulfillment, setEnableAutoFulfillment] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setProducts } = useProducts();

  // Check for existing Zinc connection in localStorage
  useEffect(() => {
    const savedConnection = localStorage.getItem("zincConnection");
    if (savedConnection) {
      try {
        const connection = JSON.parse(savedConnection);
        setIsConnected(true);
        setApiKey(getZincApiToken());
        setEnableAutoFulfillment(connection.autoFulfillment || false);
        setLastSync(connection.lastSync || null);
      } catch (e) {
        console.error("Error parsing Zinc connection data:", e);
      }
    } else {
      // If no saved connection but we have a token, set the API key
      const token = getZincApiToken();
      if (token) {
        setApiKey(token);
      }
    }
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Save the API key to localStorage first
      setZincApiToken(apiKey);
      
      // Create connection info in localStorage immediately
      // This allows us to "connect" even if API verification fails
      const connection = {
        autoFulfillment: enableAutoFulfillment,
        lastSync: Date.now()
      };
      localStorage.setItem("zincConnection", JSON.stringify(connection));
      
      // Attempt to verify API key by testing a product lookup
      try {
        // Using a known ASIN for a popular product
        const productResult = await fetchProductDetails("B09G9FPHY6");
        
        if (productResult) {
          console.log("Successfully verified API key with product lookup");
          toast.success("Connection successful", {
            description: "Successfully connected to Zinc API"
          });
        } else {
          console.warn("Product lookup returned null, but continuing with connection");
          toast.warning("Limited connection established", {
            description: "API token saved, but product verification failed. See browser console for CORS testing options."
          });
        }
      } catch (apiError) {
        console.error("Error during API verification:", apiError);
        
        // Check if it's a CORS error
        if (apiError instanceof TypeError && apiError.message.includes('Failed to fetch')) {
          toast.warning("Connection established with limitations", {
            description: "API token saved, but browser security (CORS) is preventing direct API calls. Try using a CORS browser extension for testing."
          });
        } else {
          toast.warning("Limited connection established", {
            description: "API token saved, but verification failed. See browser console for testing options."
          });
        }
      }
      
      setIsConnected(true);
      setLastSync(Date.now());
      
      return true;
    } catch (err) {
      console.error("Error connecting to Zinc:", err);
      setError("Failed to connect to Zinc API due to browser security (CORS) restrictions. Your API token has been saved but real API calls may not work without a CORS solution.");
      
      toast.error("Connection issues detected", {
        description: "Browser security may prevent direct API calls. Your token is saved but searches may use mock data until CORS is resolved."
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("zincConnection");
    clearZincApiToken();
    setIsConnected(false);
    setApiKey("");
    toast.success("Disconnected", {
      description: "Disconnected from Zinc API"
    });
    
    // Remove Amazon products from context
    setProducts(prevProducts => prevProducts.filter(p => p.vendor !== "Amazon via Zinc"));
    
    // Remove from localStorage
    localStorage.removeItem("amazonProducts");
  };

  const updateLastSync = (time: number = Date.now()) => {
    setLastSync(time);
    
    // Update connection with new sync time
    const connection = JSON.parse(localStorage.getItem("zincConnection") || "{}");
    connection.lastSync = time;
    localStorage.setItem("zincConnection", JSON.stringify(connection));
  };

  return {
    isConnected,
    isLoading,
    apiKey,
    setApiKey,
    enableAutoFulfillment,
    setEnableAutoFulfillment,
    handleConnect,
    handleDisconnect,
    lastSync,
    error,
    setError,
    setIsLoading,
    updateLastSync
  };
};
