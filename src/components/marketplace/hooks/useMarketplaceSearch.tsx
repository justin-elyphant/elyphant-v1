
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/contexts/ProductContext";

export const useMarketplaceSearch = () => {
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toastShownRef = useRef(false);
  const searchIdRef = useRef<string | null>(null);
  const lastSearchTermRef = useRef<string | null>(null);
  const RESULTS_LIMIT = 100; // Set limit to 100 products

  // Reset toast shown flag when component unmounts or after a delay
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
        
        const searchZincProducts = async () => {
          setIsLoading(true);
          try {
            // Request more products (we'll get up to 100 now)
            const results = await searchProducts(searchParam);
            
            if (results.length > 0) {
              // Convert to Product format
              const amazonProducts = results.map((product, index) => ({
                id: 1000 + index,
                name: product.title,
                price: product.price,
                category: product.category || "Electronics",
                image: product.image || "/placeholder.svg",
                vendor: "Elyphant", // Changed from "Amazon via Zinc"
                description: product.description || ""
              }));
              
              // Update products in context
              setProducts(prevProducts => {
                // Filter out any existing Amazon products
                const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc" && p.vendor !== "Elyphant");
                // Add the new Amazon products, limit to RESULTS_LIMIT
                return [...nonAmazonProducts, ...amazonProducts.slice(0, RESULTS_LIMIT)];
              });
              
              // Set filtered products to include amazonProducts and any matching store products
              const storeProducts = products.filter(product => 
                product.vendor !== "Amazon via Zinc" && product.vendor !== "Elyphant" && 
                (product.name.toLowerCase().includes(searchParam.toLowerCase()) || 
                (product.description && product.description.toLowerCase().includes(searchParam.toLowerCase())))
              );
              
              // Combine and limit to RESULTS_LIMIT
              setFilteredProducts([...amazonProducts.slice(0, RESULTS_LIMIT), ...storeProducts]);
              
              // Show only ONE toast notification with a summary if it's a new search
              if (!toastShownRef.current && searchChanged) {
                // Wait a bit to prevent flashing
                setTimeout(() => {
                  if (!toastShownRef.current) {
                    toastShownRef.current = true;
                    toast({
                      title: "Search Complete",
                      description: `Found ${Math.min(amazonProducts.length, RESULTS_LIMIT)} products matching "${searchParam}"`,
                      id: "search-complete", // Use consistent ID
                      duration: 3000 // Show for 3 seconds only
                    });
                  }
                }, 500);
              }
            } else {
              // If no Amazon products, just filter store products
              const storeProducts = products.filter(product => 
                product.name.toLowerCase().includes(searchParam.toLowerCase()) || 
                (product.description && product.description.toLowerCase().includes(searchParam.toLowerCase()))
              );
              
              setFilteredProducts(storeProducts.slice(0, RESULTS_LIMIT));
              
              // Only show toast if we have no results at all and haven't shown one yet for this search
              if (storeProducts.length === 0 && !toastShownRef.current && searchChanged) {
                // Wait a bit to prevent flashing
                setTimeout(() => {
                  if (!toastShownRef.current) {
                    toastShownRef.current = true;
                    toast({
                      title: "No Results Found",
                      description: `No products found for "${searchParam}"`,
                      variant: "destructive",
                      id: "no-results-found", // Use consistent ID
                      duration: 3000 // Show for 3 seconds only
                    });
                  }
                }, 500);
              }
            }
          } catch (error) {
            console.error("Error searching for products:", error);
            
            // Only show error toast once per search
            if (!toastShownRef.current && searchChanged) {
              // Wait a bit to prevent flashing
              setTimeout(() => {
                if (!toastShownRef.current) {
                  toastShownRef.current = true;
                  toast({
                    title: "Search Error",
                    description: "Error searching for products",
                    variant: "destructive",
                    id: "search-error", // Use consistent ID
                    duration: 3000 // Show for 3 seconds only
                  });
                }
              }, 500);
            }
            
            // Fall back to local product search
            const filteredStoreProducts = products.filter(product => 
              product.name.toLowerCase().includes(searchParam.toLowerCase()) || 
              (product.description && product.description.toLowerCase().includes(searchParam.toLowerCase()))
            );
            
            setFilteredProducts(filteredStoreProducts.slice(0, RESULTS_LIMIT));
          } finally {
            setIsLoading(false);
          }
        };
        
        searchZincProducts();
      } else if (categoryParam) {
        // Filter by category if no search term
        const filtered = products.filter(product => product.category === categoryParam);
        setFilteredProducts(filtered.length ? filtered.slice(0, RESULTS_LIMIT) : products.slice(0, RESULTS_LIMIT));
      } else {
        // No search term or category, show all products
        setFilteredProducts(products.slice(0, RESULTS_LIMIT));
      }
    }
  }, [location.search, products, setProducts]);

  // Get page title and subtitle from search params
  const getPageInfo = () => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const categoryName = getCategoryName(currentCategory);
    const pageTitle = searchParam ? `Search results for "${searchParam}"` : categoryName;
    const subtitle = searchParam 
      ? `Found ${filteredProducts.length} items matching your search`
      : `Browse our collection of ${currentCategory ? categoryName.toLowerCase() : "products"}`;

    return { pageTitle, subtitle };
  };

  // Helper function to get the category name
  const getCategoryName = (categoryUrl: string | null) => {
    const categoryList = [
      { url: "electronics", name: "Electronics" },
      { url: "clothing", name: "Clothing" },
      { url: "home", name: "Home & Kitchen" },
      { url: "books", name: "Books" },
      { url: "toys", name: "Toys & Games" },
      { url: "beauty", name: "Beauty & Personal Care" },
      { url: "sports", name: "Sports & Outdoors" },
      { url: "automotive", name: "Automotive" },
      { url: "baby", name: "Baby" },
      { url: "health", name: "Health & Household" },
    ];
    
    const category = categoryList.find(c => c.url === categoryUrl);
    return category ? category.name : "All Products";
  };

  return {
    currentCategory,
    filteredProducts,
    isLoading,
    getPageInfo
  };
};
