
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchZincProducts = async (searchParam: string, searchChanged: boolean) => {
    console.log('searchZincProducts called with:', { searchParam, searchChanged });
    
    // Cancel any previous search
    if (abortControllerRef.current) {
      console.log('Aborting previous search');
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this search
    abortControllerRef.current = new AbortController();
    
    // Clear any pending search timeouts to prevent race conditions
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Clear existing toasts to prevent accumulation
    toast.dismiss();
    
    setIsLoading(true);
    console.log('Set isLoading to true');
    
    try {
      console.log(`Searching for products with term: "${searchParam}"`);
      
      // Show a single loading toast with unique ID to prevent duplicates
      const loadingToastId = `search-loading-${searchParam}`;
      toast.loading("Searching...", {
        description: `Looking for products matching "${searchParam}"`,
        id: loadingToastId,
      });
      
      const results = await searchProducts(searchParam);
      console.log('Search results received:', results.length);
      
      // Check if search was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('Search was aborted');
        return [];
      }
      
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
          // Dismiss loading toast
          toast.dismiss(loadingToastId);
          
          // Use a ref to avoid multiple toasts within the same search session
          toastShownRef.current = true;
          
          // Show a single success toast with a slight delay
          searchTimeoutRef.current = setTimeout(() => {
            toast.success("Search Complete", {
              description: `Found ${Math.min(amazonProducts.length, RESULTS_LIMIT)} products matching "${searchParam}"`,
              id: `search-success-${searchParam}`,
            });
            
            // Reset toast flag after a few seconds
            setTimeout(() => {
              toastShownRef.current = false;
            }, 3000);
          }, 300);
        } else {
          // Just dismiss loading toast for repeat searches
          toast.dismiss(loadingToastId);
        }
        
        return amazonProducts;
      } else {
        console.log('No results found');
        // Dismiss loading toast
        toast.dismiss(loadingToastId);
        
        // Show toast for no results
        if (!toastShownRef.current && searchChanged) {
          toastShownRef.current = true;
          toast.error("No Results", {
            description: `No products found matching "${searchParam}"`,
            id: `search-no-results-${searchParam}`,
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
      
      // Dismiss loading toast
      toast.dismiss(`search-loading-${searchParam}`);
      
      // Only show error toast once per search
      if (!toastShownRef.current && searchChanged && !abortControllerRef.current?.signal.aborted) {
        toastShownRef.current = true;
        toast.error("Search Error", {
          description: "Error connecting to Amazon. Please try again later.",
          id: `search-error-${searchParam}`,
        });
        
        // Reset toast flag after a few seconds
        setTimeout(() => {
          toastShownRef.current = false;
        }, 3000);
      }
      
      return [];
    } finally {
      console.log('Search finally block - clearing loading state');
      // Always clear loading state
      setIsLoading(false);
      
      // Dismiss any remaining loading toasts
      toast.dismiss(`search-loading-${searchParam}`);
      
      // Clear abort controller
      abortControllerRef.current = null;
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
