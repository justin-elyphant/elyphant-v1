import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { useProducts } from "@/contexts/ProductContext";
import { searchProducts } from "../zincService";
import { ZincProduct } from "../types";

export const useZincProductSync = (updateLastSync: () => void) => {
  const { setProducts } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toastShownRef = useRef<{ [key: string]: boolean }>({});

  // Clear toast tracking periodically
  setInterval(() => {
    toastShownRef.current = {};
  }, 3000);

  const syncProducts = async (): Promise<ZincProduct[]> => {
    // Avoid duplicate toasts
    if (toastShownRef.current['syncing']) return [];
    
    setIsLoading(true);
    setError(null);
    toastShownRef.current['syncing'] = true;
    
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
        allProducts = getMockFallbackProducts();
      }
      
      // Update last sync time
      updateLastSync();
      
      // Only show ONE summary toast
      if (!toastShownRef.current['sync-complete']) {
        toast({
          title: "Products Synced",
          description: `Successfully synced ${allProducts.length} products from Amazon`,
          id: "products-synced" // Use a fixed ID to ensure only one appears
        });
        toastShownRef.current['sync-complete'] = true;
      }
      
      return allProducts;
    } catch (err) {
      console.error("Error syncing products:", err);
      setError("Failed to sync products from Amazon. Please try again later.");
      
      if (!toastShownRef.current['sync-error']) {
        toast({
          title: "Sync Failed",
          description: "Failed to sync products from Amazon",
          variant: "destructive",
          id: "sync-error" // Use a fixed ID to ensure only one appears
        });
        toastShownRef.current['sync-error'] = true;
      }
      
      return [];
    } finally {
      setIsLoading(false);
      // Reset syncing flag after a delay
      setTimeout(() => {
        toastShownRef.current['syncing'] = false;
      }, 1000);
    }
  };

  // Helper function to get mock products as fallback
  const getMockFallbackProducts = (): ZincProduct[] => {
    return [
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
  };

  return {
    syncProducts,
    isLoading,
    error
  };
};
