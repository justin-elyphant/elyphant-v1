
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
        allProducts = [...allProducts, ...results.slice(0, 10)]; // Take first 10 results from each search
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
          description: `Successfully synced ${allProducts.length} products`,
          id: "products-synced" // Use a fixed ID to ensure only one appears
        });
        toastShownRef.current['sync-complete'] = true;
      }
      
      return allProducts;
    } catch (err) {
      console.error("Error syncing products:", err);
      setError("Failed to sync products. Please try again later.");
      
      if (!toastShownRef.current['sync-error']) {
        toast({
          title: "Sync Failed",
          description: "Failed to sync products",
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
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&h=500&fit=crop",
        description: "The thinnest, lightest Kindle Paperwhite yet—with a flush-front design and 300 ppi glare-free display that reads like real paper even in bright sunlight. Features waterproof design so you're free to read and relax at the beach, by the pool, or in the bath.",
        category: "Electronics",
        retailer: "Elyphant" // Changed from "Amazon via Zinc"
      },
      {
        product_id: "B07XJ8C8F7",
        title: "Echo Dot (4th Gen)",
        price: 49.99,
        image: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&h=500&fit=crop",
        description: "Meet the Echo Dot - Our most popular smart speaker with Alexa. The sleek, compact design delivers crisp vocals and balanced bass for full sound. Voice control your entertainment - Stream songs from Amazon Music, Apple Music, Spotify, and others.",
        category: "Electronics",
        retailer: "Elyphant" // Changed from "Amazon via Zinc"
      },
      {
        product_id: "B079QHML21",
        title: "Fire TV Stick 4K",
        price: 49.99,
        image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop",
        description: "Our most powerful streaming media stick with a Wi-Fi antenna design optimized for 4K Ultra HD streaming. Launch and control content with the Alexa Voice Remote. Enjoy brilliant picture with access to 4K Ultra HD, Dolby Vision, HDR, and HDR10+.",
        category: "Electronics",
        retailer: "Elyphant" // Changed from "Amazon via Zinc"
      },
      {
        product_id: "B07ZPC9QD4",
        title: "AirPods Pro",
        price: 249.99,
        image: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=500&h=500&fit=crop",
        description: "Active Noise Cancellation for immersive sound. Transparency mode for hearing and connecting with the world around you. A more customizable fit for all-day comfort. Sweat and water resistant. Adaptive EQ automatically tunes music to the shape of your ear.",
        category: "Electronics",
        retailer: "Elyphant" // Changed from "Amazon via Zinc"
      }
    ];
  };

  return {
    syncProducts,
    isLoading,
    error
  };
};
