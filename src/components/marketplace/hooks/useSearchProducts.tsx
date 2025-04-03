
import { useState, useRef } from "react";
import { Product } from "@/contexts/ProductContext";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { toast } from "@/hooks/use-toast";

export const useSearchProducts = (setProducts: React.Dispatch<React.SetStateAction<Product[]>>) => {
  const [isLoading, setIsLoading] = useState(false);
  const toastShownRef = useRef(false);
  const searchIdRef = useRef<string | null>(null);
  const RESULTS_LIMIT = 100;

  const searchZincProducts = async (searchParam: string, searchChanged: boolean) => {
    setIsLoading(true);
    
    try {
      const results = await searchProducts(searchParam);
      
      if (results.length > 0) {
        // Convert to Product format
        const amazonProducts = results.map((product, index) => ({
          id: 1000 + index,
          name: product.title,
          price: product.price,
          category: product.category || "Electronics",
          image: product.image || "/placeholder.svg",
          vendor: "Elyphant",
          description: product.description || "",
          rating: product.rating,
          reviewCount: product.review_count
        }));
        
        // Update products in context
        setProducts(prevProducts => {
          // Filter out any existing Amazon products
          const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc" && p.vendor !== "Elyphant");
          // Add the new Amazon products, limit to RESULTS_LIMIT
          return [...nonAmazonProducts, ...amazonProducts.slice(0, RESULTS_LIMIT)];
        });
        
        // Show only ONE toast notification with a summary if it's a new search
        if (!toastShownRef.current && searchChanged) {
          // Wait a bit to prevent flashing
          setTimeout(() => {
            if (!toastShownRef.current) {
              toastShownRef.current = true;
              toast({
                title: "Search Complete",
                description: `Found ${Math.min(amazonProducts.length, RESULTS_LIMIT)} products matching "${searchParam}"`,
                id: "search-complete",
                duration: 3000
              });
            }
          }, 500);
        }
        
        return amazonProducts;
      }
      
      return [];
    } catch (error) {
      console.error("Error searching for products:", error);
      
      // Only show error toast once per search
      if (!toastShownRef.current && searchChanged) {
        setTimeout(() => {
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast({
              title: "Search Error",
              description: "Error searching for products",
              variant: "destructive",
              id: "search-error",
              duration: 3000
            });
          }
        }, 500);
      }
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchZincProducts,
    isLoading,
    toastShownRef,
    searchIdRef,
    RESULTS_LIMIT
  };
};
