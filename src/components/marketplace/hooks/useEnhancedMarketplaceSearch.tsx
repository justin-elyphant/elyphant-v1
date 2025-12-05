
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useAdvancedFilters } from "@/hooks/useAdvancedFilters";
import { productCatalogService } from "@/services/ProductCatalogService";
import { toast } from "sonner";

export const useEnhancedMarketplaceSearch = (currentPage: number) => {
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRequestRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSearchingRef = useRef(false);
  
  // Get search term from URL
  const searchParams = new URLSearchParams(location.search);
  let urlSearchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  const brandCategoriesParam = searchParams.get("brandCategories");
  
  if (categoryParam) urlSearchTerm = "category=" + categoryParam;
  if (brandCategoriesParam) urlSearchTerm = "brandCategories=" + brandCategoriesParam;
  
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
    }
  }, [urlSearchTerm, searchTerm, setSearchTerm]);

  // Load default products on initial load and perform search when there's a search term
  useEffect(() => {
    if (isSearchingRef.current) {
      return;
    }

    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm, currentPage);
    } else {
      loadDefaultProducts();
    }
  }, [debouncedSearchTerm, currentPage]);

  const performSearch = async (query: string, page: number) => {
    if (isSearchingRef.current) {
      console.log('Search already in progress, skipping');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const searchId = `${query}-${page}-${Date.now()}`;
    searchRequestRef.current = searchId;

    isSearchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Enhanced search for: "${query}" (page ${page})`);
      
      const searchResult = await productCatalogService.searchProducts(query, { 
        page, 
        limit: 50 
      });
      
      if (searchRequestRef.current !== searchId || abortControllerRef.current?.signal.aborted) {
        console.log('Search cancelled or superseded');
        return;
      }
      
      if (searchResult.error) {
        throw new Error(searchResult.error);
      }
      
      if (searchResult.products && searchResult.products.length > 0) {
        const normalizedProducts = searchResult.products.map(result => ({
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

        console.log("Normalized products: ", normalizedProducts.length);
        
        setProducts(prev => {
          const nonZincProducts = prev.filter(p => 
            p.vendor !== "Amazon via Zinc" && 
            p.vendor !== "Elyphant"
          );
          return [...nonZincProducts, ...normalizedProducts];
        });
        
        if (page === 1) {
          console.log(`Search completed: Found ${searchResult.products.length} results for "${query}"`);
        }
      } else if (page === 1) {
        toast.info("No results found", {
          description: `No products found matching "${query}"`
        });
      }
      
    } catch (err) {
      if (searchRequestRef.current === searchId && !abortControllerRef.current?.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : "Search failed";
        setError(errorMessage);
        
        toast.error("Search error", {
          description: errorMessage,
          action: {
            label: "Retry",
            onClick: () => performSearch(query, page)
          }
        });
      }
    } finally {
      if (searchRequestRef.current === searchId) {
        setIsLoading(false);
        isSearchingRef.current = false;
      }
    }
  };

  const handleRetrySearch = () => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm, currentPage);
    }
  };

  const loadDefaultProducts = async () => {
    if (isSearchingRef.current) {
      console.log('Search already in progress, skipping default products load');
      return;
    }

    isSearchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading default marketplace products...');
      
      const defaultResult = await productCatalogService.searchProducts('', { 
        limit: 50,
        bestSellingCategory: true 
      });
      
      if (defaultResult.error) {
        throw new Error(defaultResult.error);
      }
      
      if (defaultResult.products && defaultResult.products.length > 0) {
        const normalizedProducts = defaultResult.products.map(result => ({
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

        console.log("Loaded default products: ", normalizedProducts.length);
        setProducts(normalizedProducts);
      } else {
        console.log("No default products found");
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products";
      setError(errorMessage);
      
      toast.error("Error loading marketplace", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => loadDefaultProducts()
        }
      });
    } finally {
      setIsLoading(false);
      isSearchingRef.current = false;
    }
  };

  const clearCache = () => {
    // Database is the cache now - just refresh
    toast.success("Refreshing products...");
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm, currentPage);
    } else {
      loadDefaultProducts();
    }
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isSearchingRef.current = false;
    };
  }, []);

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
    clearCache,
    loadDefaultProducts
  };
};
