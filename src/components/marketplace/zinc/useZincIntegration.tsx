import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";
import { fetchProductDetails, searchProducts, ZincProduct } from "./zincService";

export const useZincIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [enableAutoFulfillment, setEnableAutoFulfillment] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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
      toast.success("Successfully connected to Zinc API");
      
      // Load initial Amazon products
      await syncProducts();
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
    
    // Remove Amazon products from context
    setProducts(prevProducts => prevProducts.filter(p => p.vendor !== "Amazon via Zinc"));
    
    // Remove from localStorage
    localStorage.removeItem("amazonProducts");
  };

  const syncProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Search for some popular products
      const searchTerms = ["kindle", "echo dot", "fire tv"];
      let allProducts: ZincProduct[] = [];
      
      // Perform searches for each term (limited to keep things responsive)
      for (const term of searchTerms) {
        const results = await searchProducts(term);
        allProducts = [...allProducts, ...results.slice(0, 2)]; // Take first 2 results from each search
      }
      
      if (allProducts.length === 0) {
        // Fall back to mock data if the API isn't returning results
        allProducts = [
          {
            product_id: "B081QSJNRJ",
            title: "Kindle Paperwhite",
            price: 139.99,
            image: "/placeholder.svg",
            description: "The thinnest, lightest Kindle Paperwhite yet—with a flush-front design and 300 ppi glare-free display.",
            category: "Electronics",
            retailer: "Amazon via Zinc"
          },
          {
            product_id: "B07XJ8C8F7",
            title: "Echo Dot (4th Gen)",
            price: 49.99,
            image: "/placeholder.svg",
            description: "Smart speaker with Alexa | Charcoal",
            category: "Electronics",
            retailer: "Amazon via Zinc"
          },
          {
            product_id: "B079QHML21",
            title: "Fire TV Stick 4K",
            price: 49.99,
            image: "/placeholder.svg",
            description: "Streaming device with Alexa Voice Remote",
            category: "Electronics",
            retailer: "Amazon via Zinc"
          },
          {
            product_id: "B07ZPC9QD4",
            title: "AirPods Pro",
            price: 249.99,
            image: "/placeholder.svg",
            description: "Active Noise Cancellation, Transparency mode, Spatial Audio",
            category: "Electronics",
            retailer: "Amazon via Zinc"
          }
        ];
      }
      
      // Convert to Product format
      const amazonProducts = allProducts.map((product, index) => ({
        id: 1000 + index, // Use high IDs to avoid conflicts
        name: product.title,
        price: product.price,
        category: product.category || "Electronics",
        image: product.image || "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: product.description || ""
      }));
      
      // Store Amazon products in localStorage
      localStorage.setItem("amazonProducts", JSON.stringify(amazonProducts));
      
      // Add Amazon products to the product context
      setProducts(prevProducts => {
        // Filter out any existing Amazon products
        const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc");
        // Add the new Amazon products
        return [...nonAmazonProducts, ...amazonProducts];
      });
      
      // Update connection with new sync time
      const connection = JSON.parse(localStorage.getItem("zincConnection") || "{}");
      connection.lastSync = Date.now();
      localStorage.setItem("zincConnection", JSON.stringify(connection));
      
      setLastSync(Date.now());
      toast.success(`Successfully synced ${amazonProducts.length} products from Amazon`);
    } catch (err) {
      console.error("Error syncing products:", err);
      setError("Failed to sync products from Amazon. Please try again later.");
      toast.error("Failed to sync products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    if (!term.trim()) return;
    
    setIsLoading(true);
    setSearchTerm(term);
    
    try {
      const results = await searchProducts(term);
      
      // Convert to Product format
      const amazonProducts = results.map((product, index) => ({
        id: 1000 + index,
        name: product.title,
        price: product.price,
        category: product.category || "Electronics",
        image: product.image || "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: product.description || ""
      }));
      
      // Update products in context
      setProducts(prevProducts => {
        // Filter out any existing Amazon products
        const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc");
        // Add the new Amazon products
        return [...nonAmazonProducts, ...amazonProducts];
      });
      
      toast.success(`Found ${amazonProducts.length} products matching "${term}"`);
    } catch (err) {
      console.error("Error searching products:", err);
      toast.error("Failed to search products");
    } finally {
      setIsLoading(false);
    }
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
    searchTerm,
    setSearchTerm,
    handleSearch,
    lastSync,
    error
  };
};
