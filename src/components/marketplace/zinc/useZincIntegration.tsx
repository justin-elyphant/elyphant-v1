
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";

export const useZincIntegration = () => {
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
      // Simulate API call to verify Zinc connection
      // In a real implementation, this would be an API call to verify the API key
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save connection info to localStorage
      const connection = {
        apiKey,
        autoFulfillment: enableAutoFulfillment,
        lastSync: Date.now()
      };
      localStorage.setItem("zincConnection", JSON.stringify(connection));
      
      setIsConnected(true);
      setLastSync(Date.now());
      toast.success("Successfully connected to Zinc API");
      
      // Load mock Amazon products
      loadMockAmazonProducts();
    } catch (err) {
      console.error("Error connecting to Zinc:", err);
      setError("Failed to connect to Zinc API. Please check your API key and try again.");
      toast.error("Failed to connect to Zinc API");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("zincConnection");
    setIsConnected(false);
    setApiKey("");
    toast.info("Disconnected from Zinc API");
  };

  const syncProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call to sync products
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update last sync time
      const connection = JSON.parse(localStorage.getItem("zincConnection") || "{}");
      connection.lastSync = Date.now();
      localStorage.setItem("zincConnection", JSON.stringify(connection));
      
      setLastSync(Date.now());
      toast.success("Successfully synced products from Amazon");
      
      // Refresh mock Amazon products
      loadMockAmazonProducts();
    } catch (err) {
      console.error("Error syncing products:", err);
      setError("Failed to sync products from Amazon. Please try again later.");
      toast.error("Failed to sync products");
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadMockAmazonProducts = () => {
    // Create mock Amazon products
    const amazonProducts = [
      {
        id: 101,
        name: "Kindle Paperwhite",
        price: 139.99,
        category: "Electronics",
        image: "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: "The thinnest, lightest Kindle Paperwhite yet—with a flush-front design and 300 ppi glare-free display."
      },
      {
        id: 102,
        name: "Echo Dot (4th Gen)",
        price: 49.99,
        category: "Electronics",
        image: "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: "Smart speaker with Alexa | Charcoal"
      },
      {
        id: 103,
        name: "Fire TV Stick 4K",
        price: 49.99,
        category: "Electronics",
        image: "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: "Streaming device with Alexa Voice Remote"
      },
      {
        id: 104,
        name: "AirPods Pro",
        price: 249.99,
        category: "Electronics",
        image: "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: "Active Noise Cancellation, Transparency mode, Spatial Audio"
      }
    ];
    
    // Store Amazon products in localStorage
    localStorage.setItem("amazonProducts", JSON.stringify(amazonProducts));
    
    // Add Amazon products to the product context
    setProducts(prevProducts => {
      // Filter out any existing Amazon products
      const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc");
      // Add the new Amazon products
      return [...nonAmazonProducts, ...amazonProducts];
    });
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
    syncProducts,
    lastSync,
    error
  };
};
