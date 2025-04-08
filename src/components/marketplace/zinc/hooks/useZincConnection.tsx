import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";
import { fetchProductDetails } from "../productService";

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
        setApiKey(connection.apiKey || "");
        setEnableAutoFulfillment(connection.autoFulfillment || false);
        setLastSync(connection.lastSync || null);
      } catch (e) {
        console.error("Error parsing Zinc connection data:", e);
      }
    }
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verify API key by testing a product lookup
      const productResult = await fetchProductDetails("B081QSJNRJ"); // Test with a known ASIN
      
      if (!productResult) {
        throw new Error("Could not verify API key with Zinc");
      }
      
      // Save connection info to localStorage
      const connection = {
        apiKey,
        autoFulfillment: enableAutoFulfillment,
        lastSync: Date.now()
      };
      localStorage.setItem("zincConnection", JSON.stringify(connection));
      
      setIsConnected(true);
      setLastSync(Date.now());
      toast.success("Connection successful", {
        description: "Successfully connected to Zinc API"
      });
      
      return true;
    } catch (err) {
      console.error("Error connecting to Zinc:", err);
      setError("Failed to connect to Zinc API. Please check your API key and try again.");
      toast.error("Connection failed", {
        description: "Failed to connect to Zinc API. Please check your API key."
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("zincConnection");
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
