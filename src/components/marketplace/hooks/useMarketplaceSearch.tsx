
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { toast } from "@/hooks/use-toast";
import { useSearchProducts } from "./useSearchProducts";
import { useFilterProducts } from "./useFilterProducts";
import { usePageInfo } from "./usePageInfo";

export const useMarketplaceSearch = () => {
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const lastSearchTermRef = useRef<string | null>(null);
  
  // Get our custom hooks
  const { 
    searchZincProducts, 
    isLoading, 
    toastShownRef, 
    searchIdRef,
    RESULTS_LIMIT 
  } = useSearchProducts(setProducts);
  
  const { 
    filteredProducts, 
    filterByCategory,
    filterBySearch 
  } = useFilterProducts(products, RESULTS_LIMIT);
  
  const { getPageInfo } = usePageInfo(currentCategory, filteredProducts);

  // Reset toast shown flag when component unmounts
  useEffect(() => {
    return () => {
      toastShownRef.current = false;
      searchIdRef.current = null;
      lastSearchTermRef.current = null;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    const searchParam = params.get("search");
    
    // Only process if the search parameter has actually changed
    if (searchParam !== lastSearchTermRef.current) {
      // Update last search term
      lastSearchTermRef.current = searchParam;
      
      // Generate unique search ID to track this search session
      const newSearchId = searchParam ? `search-${Date.now()}` : null;
      const searchChanged = searchParam !== searchIdRef.current;
      
      if (searchChanged) {
        // Reset the toast flag for new searches
        toastShownRef.current = false;
        searchIdRef.current = newSearchId;
      }
      
      setCurrentCategory(categoryParam);
      
      // If there's a search term in the URL, search for products using Zinc API
      if (searchParam) {
        // Immediately dismiss any existing toasts
        toast({
          id: "search-in-progress",
          duration: 0 // Use 0 to immediately dismiss
        });
        
        searchZincProducts(searchParam, searchChanged).then(amazonProducts => {
          filterBySearch(searchParam, amazonProducts);
        });
      } else if (categoryParam) {
        // Filter by category if no search term
        filterByCategory(categoryParam);
      } else {
        // No search term or category, show all products
        filterByCategory(null);
      }
    }
  }, [location.search, products, setProducts]);

  return {
    currentCategory,
    filteredProducts,
    isLoading,
    getPageInfo
  };
};
