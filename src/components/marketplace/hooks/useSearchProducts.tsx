
import { useState, useRef } from "react";
import { Product } from "@/contexts/ProductContext";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { toast } from "sonner";
import { normalizeProduct } from "@/contexts/ProductContext";

export const useSearchProducts = (setProducts: React.Dispatch<React.SetStateAction<Product[]>>) => {
  const [isLoading, setIsLoading] = useState(false);
  const toastShownRef = useRef(false);
  const searchIdRef = useRef<string | null>(null);
  const RESULTS_LIMIT = 100;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchZincProducts = async (searchParam: string, searchChanged: boolean) => {
    // Clear any pending search timeouts to prevent race conditions
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Clear existing toasts to prevent accumulation
    toast.dismiss();
    
    setIsLoading(true);
    
    try {
      console.log(`Searching for products with term: "${searchParam}"`);
      
      // Show a single loading toast with unique ID to prevent duplicates
      toast.loading("Searching...", {
        description: `Looking for products matching "${searchParam}"`,
        id: `search-loading-${searchParam}`, // Use consistent ID to prevent duplicates
      });
      
      const results = await searchProducts(searchParam);
      
      if (results.length > 0) {
        // Convert to Product format and standardize
        const amazonProducts = results.map((product) => {
          return normalizeProduct({
            id: product.product_id,
            product_id: product.product_id,
            title: product.title || "Product",
            price: product.price,
            category: product.category || "Electronics",
            image: product.image || "/placeholder.svg",
            vendor: "Amazon via Zinc",
            description: product.description || "",
            rating: product.rating,
            reviewCount: product.review_count
          });
        });
        
        // Update products in context
        setProducts(prevProducts => {
          // Filter out any existing Amazon products
          const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc" && p.vendor !== "Elyphant");
          // Add the new Amazon products, limit to RESULTS_LIMIT
          return [...nonAmazonProducts, ...amazonProducts.slice(0, RESULTS_LIMIT)];
        });
        
        // Show only ONE toast notification with a summary if it's a new search
        if (!toastShownRef.current && searchChanged) {
          // Dismiss any existing toasts first
          toast.dismiss(`search-loading-${searchParam}`);
          
          // Use a ref to avoid multiple toasts within the same search session
          toastShownRef.current = true;
          
          // Show a single success toast with a slight delay
          searchTimeoutRef.current = setTimeout(() => {
            toast.success("Search Complete", {
              description: `Found ${Math.min(amazonProducts.length, RESULTS_LIMIT)} products matching "${searchParam}"`,
              id: `search-success-${searchParam}`, // Use consistent ID to prevent duplicates
            });
            
            // Reset toast flag after a few seconds
            setTimeout(() => {
              toastShownRef.current = false;
            }, 3000);
          }, 300);
        }
        
        return amazonProducts;
      } else {
        // Show toast for no results
        if (!toastShownRef.current && searchChanged) {
          // Dismiss loading toast
          toast.dismiss(`search-loading-${searchParam}`);
          
          // Show no results toast
          toastShownRef.current = true;
          toast.error("No Results", {
            description: `No products found matching "${searchParam}"`,
            id: `search-no-results-${searchParam}`, // Use consistent ID to prevent duplicates
          });
          
          // Reset toast flag after a few seconds
          setTimeout(() => {
            toastShownRef.current = false;
          }, 3000);
        }
        
        return [];
      }
      
    } catch (error) {
      console.error("Error searching for products:", error);
      
      // Only show error toast once per search
      if (!toastShownRef.current && searchChanged) {
        // Dismiss loading toast
        toast.dismiss(`search-loading-${searchParam}`);
        
        // Show error toast
        toastShownRef.current = true;
        toast.error("Search Error", {
          description: "Error connecting to Amazon. Please try again later.",
          id: `search-error-${searchParam}`, // Use consistent ID to prevent duplicates
        });
        
        // Reset toast flag after a few seconds
        setTimeout(() => {
          toastShownRef.current = false;
        }, 3000);
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
