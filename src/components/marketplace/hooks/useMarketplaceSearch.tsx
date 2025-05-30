
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
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  
  // Get our custom hooks
  const { 
    searchZincProducts, 
    isLoading: searchIsLoading, 
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

  // Combined loading state
  const isLoading = isLocalLoading || searchIsLoading || searchInProgressRef.current;

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
      setIsLocalLoading(false);
      // Dismiss any remaining toasts on cleanup
      toast.dismiss();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    const searchParam = params.get("search");
    const brandParam = params.get("brand");
    
    console.log('useMarketplaceSearch: URL params changed', { categoryParam, searchParam, brandParam });
    
    // Prevent duplicate searches
    if (searchInProgressRef.current) {
      console.log('Search already in progress, skipping duplicate request');
      return;
    }
    
    // Only process if the search parameter has actually changed
    if (searchParam !== lastSearchTermRef.current) {
      console.log('Search parameter changed from', lastSearchTermRef.current, 'to', searchParam);
      
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
        console.log('Starting search for:', searchParam);
        
        // Set search in progress flag and local loading
        searchInProgressRef.current = true;
        setIsLocalLoading(true);
        
        // Immediately dismiss any existing toasts
        toast.dismiss();
        
        searchZincProducts(searchParam, searchChanged).then(amazonProducts => {
          console.log('Search completed, filtering results');
          filterBySearch(searchParam, amazonProducts);
        }).catch(error => {
          console.error('Search error:', error);
          toast.error("Search Error", {
            description: "Error searching for products. Please try again.",
            id: "search-error"
          });
        }).finally(() => {
          console.log('Search finalized, clearing loading states');
          // Always clear the search in progress flag and local loading
          searchInProgressRef.current = false;
          setIsLocalLoading(false);
          
          // Dismiss any category or brand loading toasts that might be lingering
          if (categoryParam) {
            toast.dismiss(`category-search-${categoryParam}`);
          }
          if (brandParam) {
            toast.dismiss(`brand-loading-${brandParam}`);
          }
        });
      } else if (brandParam) {
        // If there's a brand parameter but no search, we'll handle it elsewhere
        console.log(`Using brand parameter: ${brandParam}`);
        setIsLocalLoading(false);
        searchInProgressRef.current = false;
        // Dismiss brand loading toast
        toast.dismiss(`brand-loading-${brandParam}`);
      } else if (categoryParam) {
        // Filter by category if no search term or brand
        console.log('Filtering by category:', categoryParam);
        filterByCategory(categoryParam);
        setIsLocalLoading(false);
        searchInProgressRef.current = false;
        // Dismiss category loading toast
        toast.dismiss(`category-search-${categoryParam}`);
      } else {
        // No search term, brand, or category, show all products
        console.log('Showing all products');
        filterByCategory(null);
        setIsLocalLoading(false);
        searchInProgressRef.current = false;
        // Dismiss any lingering loading toasts
        toast.dismiss();
      }
    } else if (categoryParam !== currentCategory) {
      // Category changed but search term is the same
      console.log('Category changed to:', categoryParam);
      setCurrentCategory(categoryParam);
      if (categoryParam && !searchParam) {
        filterByCategory(categoryParam);
        // Dismiss category loading toast
        toast.dismiss(`category-search-${categoryParam}`);
      }
      setIsLocalLoading(false);
      searchInProgressRef.current = false;
    } else {
      // No changes, ensure loading is cleared
      setIsLocalLoading(false);
      searchInProgressRef.current = false;
      // Dismiss any lingering loading toasts
      toast.dismiss();
    }
  }, [location.search, products, setProducts]);

  return {
    currentCategory,
    filteredProducts,
    isLoading,
    getPageInfo
  };
};
