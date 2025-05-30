
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { useSearchProducts } from "./useSearchProducts";
import { useFilterProducts } from "./useFilterProducts";
import { usePageInfo } from "./usePageInfo";
import { ZincProduct } from "../zinc/types";
import { convertZincProductToProduct } from "../zinc/utils/productConverter";

export const useMarketplaceSearch = () => {
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const lastSearchTermRef = useRef<string | null>(null);
  const searchInProgressRef = useRef<boolean>(false);
  
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

  // Check for a stored product from search
  useEffect(() => {
    try {
      const selectedProduct = sessionStorage.getItem('selected_search_product');
      if (selectedProduct) {
        // Convert the Zinc product to our product format
        const parsedProduct = JSON.parse(selectedProduct);
        
        // Only add the product if we need to
        const existingProductIndex = products.findIndex(p => 
          (p.name === parsedProduct.title || p.id === parsedProduct.product_id)
        );
        
        if (existingProductIndex === -1) {
          // Convert ZincProduct to our Product format
          const newProduct = convertZincProductToProduct(parsedProduct);
          
          // Add this product to the context
          setProducts(prevProducts => [...prevProducts, newProduct]);
        }
        
        // Clear from session storage after processing
        sessionStorage.removeItem('selected_search_product');
      }
    } catch (e) {
      console.error('Failed to process selected search product:', e);
    }
  }, []);

  // Reset toast shown flag when component unmounts
  useEffect(() => {
    return () => {
      toastShownRef.current = false;
      searchIdRef.current = null;
      lastSearchTermRef.current = null;
      searchInProgressRef.current = false;
      // Dismiss any remaining toasts on cleanup
      toast.dismiss();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    const searchParam = params.get("search");
    const brandParam = params.get("brand");
    
    // Prevent duplicate searches
    if (searchInProgressRef.current) {
      console.log('Search already in progress, skipping duplicate request');
      return;
    }
    
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
        // Set search in progress flag
        searchInProgressRef.current = true;
        
        // Immediately dismiss any existing toasts
        toast.dismiss();
        
        searchZincProducts(searchParam, searchChanged).then(amazonProducts => {
          filterBySearch(searchParam, amazonProducts);
        }).catch(error => {
          console.error('Search error:', error);
        }).finally(() => {
          // Always clear the search in progress flag
          searchInProgressRef.current = false;
        });
      } else if (brandParam) {
        // If there's a brand parameter but no search, we'll handle it elsewhere
        console.log(`Using brand parameter: ${brandParam}`);
      } else if (categoryParam) {
        // Filter by category if no search term or brand
        filterByCategory(categoryParam);
      } else {
        // No search term, brand, or category, show all products
        filterByCategory(null);
      }
    }
  }, [location.search, products, setProducts]);

  return {
    currentCategory,
    filteredProducts,
    isLoading: isLoading || searchInProgressRef.current,
    getPageInfo
  };
};
