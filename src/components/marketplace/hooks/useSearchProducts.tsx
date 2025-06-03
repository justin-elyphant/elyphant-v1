
import { useState, useRef } from "react";
import { Product } from "@/contexts/ProductContext";
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch";
import { optimizedSearchService } from "@/services/search/optimizedSearchService";
import { convertZincProductToProduct } from "../zinc/utils/productConverter";
import { normalizeProduct } from "@/contexts/ProductContext";
import { toast } from "sonner";

export const useSearchProducts = (setProducts: React.Dispatch<React.SetStateAction<Product[]>>) => {
  const [isLoading, setIsLoading] = useState(false);
  const toastShownRef = useRef(false);
  const searchIdRef = useRef<string | null>(null);
  const RESULTS_LIMIT = 100;

  // Use our optimized search hook
  const {
    search: optimizedSearch,
    results: searchResults,
    isLoading: hookIsLoading,
    error: searchError,
    getStats
  } = useOptimizedSearch(
    // Search function that calls our optimized service
    async (query: string) => {
      return optimizedSearchService.searchProducts(query, { maxResults: RESULTS_LIMIT });
    },
    {
      debounceMs: 500,
      minQueryLength: 3,
      maxSearchesPerSession: 50,
      onSearchStart: () => {
        console.log('Optimized search started');
      },
      onSearchComplete: (results, fromCache) => {
        const stats = getStats();
        console.log(`Optimized search completed: ${results.length} results ${fromCache ? '(cached)' : '(API)'}`);
        console.log('Search stats:', stats);
        
        // Show cache savings info
        if (fromCache && stats.costSaved > 0) {
          toast.success("Search Complete (Cached)", {
            description: `Found ${results.length} products instantly. Saved $${stats.costSaved.toFixed(3)} in API costs.`,
            duration: 2000
          });
        }
      },
      onSearchError: (error) => {
        console.error('Optimized search error:', error);
      }
    }
  );

  // Update loading state
  const combinedIsLoading = isLoading || hookIsLoading;

  const searchZincProducts = async (searchParam: string, searchChanged: boolean) => {
    console.log('Optimized searchZincProducts called with:', { searchParam, searchChanged });
    
    if (!searchParam || searchParam.trim().length < 3) {
      console.log('Query too short, skipping search');
      return [];
    }

    // Reset toast flag for new searches
    if (searchChanged) {
      toastShownRef.current = false;
      searchIdRef.current = `search-${Date.now()}`;
    }

    setIsLoading(true);
    
    try {
      // Use the optimized search
      await optimizedSearch(searchParam);
      
      // Convert results to Product format
      if (searchResults && searchResults.length > 0) {
        const amazonProducts = searchResults.map((product) => {
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
          const nonAmazonProducts = prevProducts.filter(p => 
            p.vendor !== "Amazon via Zinc" && p.vendor !== "Elyphant"
          );
          return [...nonAmazonProducts, ...amazonProducts.slice(0, RESULTS_LIMIT)];
        });
        
        // Show success toast with optimization info
        if (!toastShownRef.current && searchChanged) {
          toastShownRef.current = true;
          
          const stats = getStats();
          const savingsMessage = stats.costSaved > 0 
            ? ` • Saved $${stats.costSaved.toFixed(2)} (${stats.apiCallsSaved} cached searches)`
            : '';
          
          toast.success("Search Complete", {
            description: `Found ${amazonProducts.length} products${savingsMessage}`,
            duration: 3000
          });
          
          // Reset toast flag
          setTimeout(() => {
            toastShownRef.current = false;
          }, 3000);
        }
        
        return amazonProducts;
      } else {
        // No results
        if (!toastShownRef.current && searchChanged) {
          toastShownRef.current = true;
          toast.error("No Results", {
            description: `No products found matching "${searchParam}"`,
          });
          
          setTimeout(() => {
            toastShownRef.current = false;
          }, 3000);
        }
        
        return [];
      }
      
    } catch (error) {
      console.error("Optimized search error:", error);
      
      if (!toastShownRef.current && searchChanged) {
        toastShownRef.current = true;
        toast.error("Search Error", {
          description: "Error connecting to product search. Please try again.",
        });
        
        setTimeout(() => {
          toastShownRef.current = false;
        }, 3000);
      }
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get optimization statistics
  const getOptimizationStats = () => {
    return getStats();
  };

  return {
    searchZincProducts,
    isLoading: combinedIsLoading,
    toastShownRef,
    searchIdRef,
    RESULTS_LIMIT,
    getOptimizationStats
  };
};
