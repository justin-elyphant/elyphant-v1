
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
      toast({
        title: "Syncing Products",
        description: "Fetching products from Amazon...",
        id: "sync-in-progress"
      });
      
      // Search for some popular products
      const searchTerms = ["kindle", "echo dot", "fire tv"];
      let allProducts: ZincProduct[] = [];
      
      // Perform searches for each term
      for (const term of searchTerms) {
        const results = await searchProducts(term);
        allProducts = [...allProducts, ...results.slice(0, 10)]; // Take first 10 results from each search
      }
      
      if (allProducts.length === 0) {
        throw new Error("No products found");
      }
      
      // Convert to Product format
      const amazonProducts = allProducts.map((product, index) => ({
        id: 2000 + index, // Use a different ID range to avoid conflicts
        name: product.title,
        price: product.price,
        category: product.category || "Electronics",
        image: product.image || "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: product.description || "",
        rating: product.rating,
        reviewCount: product.review_count
      }));
      
      // Update products in context
      setProducts(prevProducts => {
        // Filter out any existing Amazon products
        const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc" && p.vendor !== "Elyphant");
        // Add the new Amazon products
        return [...nonAmazonProducts, ...amazonProducts];
      });
      
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
      setError("Failed to sync products. Please try again later.");
      
      if (!toastShownRef.current['sync-error']) {
        toast({
          title: "Sync Failed",
          description: "Failed to fetch products from Amazon. Please try again later.",
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

  return {
    syncProducts,
    isLoading,
    error
  };
};
