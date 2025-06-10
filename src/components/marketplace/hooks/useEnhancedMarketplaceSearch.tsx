
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useAdvancedFilters } from "@/hooks/useAdvancedFilters";
import { enhancedZincApiService, ZincSearchResponse } from "@/services/enhancedZincApiService";
import { toast } from "sonner";

export const useEnhancedMarketplaceSearch = (currentPage) => {
  console.log("useEnhancedMarketPlace search");
  console.log(currentPage);
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchIdRef = useRef<string>("");
  
  // Get search term from URL
  const searchParams = new URLSearchParams(location.search);
  let urlSearchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  if (categoryParam) urlSearchTerm = "category="+categoryParam;
  
  // Use debounced search
  const {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    setSearchTerm
  } = useDebounceSearch({ 
    initialValue: urlSearchTerm,
    delay: 300 
  });

  // Use advanced filters
  const {
    filters,
    filteredProducts,
    availableCategories,
    activeFilterCount,
    updateFilters,
    clearFilters
  } = useAdvancedFilters(products);

  // Update search term when URL changes
  useEffect(() => {
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
      performSearch(urlSearchTerm, currentPage);
    }
  }, [urlSearchTerm, searchTerm, setSearchTerm]);

  useEffect(() => {
    performSearch(urlSearchTerm, currentPage);
  }, [currentPage]);

  // Perform search when debounced term changes
  useEffect(() => {
    // if (debouncedSearchTerm && debouncedSearchTerm !== searchIdRef.current) {
      // searchIdRef.current = debouncedSearchTerm;
      // performSearch(debouncedSearchTerm);
    // }
  }, []);

  // Prefetch popular searches on mount
  // useEffect(() => {
  //   const fetchProductsAsync = async () => {
  //     try {
  //       const prefetchProducts:ZincSearchResponse[] = await enhancedZincApiService.prefetchPopularSearches();

  //       if (prefetchProducts && prefetchProducts.length > 0) {
  //         const combinedProducts = prefetchProducts.flatMap(prefetch => 
  //           prefetch.results.map(result => ({
  //             id: result.product_id,
  //             product_id: result.product_id,
  //             name: result.title,
  //             title: result.title,
  //             price: result.price,
  //             category: result.category,
  //             image: result.image,
  //             vendor: result.retailer || "Amazon via Zinc",
  //             description: result.description,
  //             rating: result.stars,
  //             reviewCount: result.num_reviews
  //           }))
  //         );
  //         console.log("useEnhancedMMSS..83", combinedProducts);
  //         setProducts(combinedProducts);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching popular searches:', error);
  //     }
  //   }
  //   fetchProductsAsync();
  // }, []);

  const performSearch = async (query: string, page: number) => {
    console.log("performSearch");
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Enhanced search for: "${query}"`);
      
      const searchResult = await enhancedZincApiService.searchProducts(query, page, 50);
      
      if (searchResult.error && !searchResult.cached) {
        throw new Error(searchResult.error);
      }
      
      if (searchResult.results && searchResult.results.length > 0) {
        // Convert to Product format and update context
        const normalizedProducts = searchResult.results.map(result => ({
          id: result.product_id,
          product_id: result.product_id,
          name: result.title,
          title: result.title,
          price: result.price,
          category: result.category,
          image: result.image,
          vendor: result.retailer || "Amazon via Zinc",
          description: result.description,
          rating: result.stars,
          reviewCount: result.num_reviews
        }));
        
        // Update products context
        setProducts(prev => {
          const nonZincProducts = prev.filter(p => 
            p.vendor !== "Amazon via Zinc" && 
            p.vendor !== "Elyphant"
          );
          return [...nonZincProducts, ...normalizedProducts];
        });
        
        const description = searchResult.cached 
          ? `Found ${searchResult.results.length} cached results for "${query}"`
          : `Found ${searchResult.results.length} results for "${query}"`;
          
        toast.success("Search completed", { description });
      } else {
        toast.info("No results found", {
          description: `No products found matching "${query}"`
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      setError(errorMessage);
      
      toast.error("Search error", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => performSearch(query, page)
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrySearch = () => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm, currentPage);
    }
  };

  const clearCache = () => {
    enhancedZincApiService.clearCache();
    toast.success("Search cache cleared");
  };

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching: isSearching || isLoading,
    setSearchTerm,
    currentPage,
    filters,
    filteredProducts,
    availableCategories,
    activeFilterCount,
    updateFilters,
    clearFilters,
    error,
    isLoading,
    handleRetrySearch,
    clearCache
  };
};
