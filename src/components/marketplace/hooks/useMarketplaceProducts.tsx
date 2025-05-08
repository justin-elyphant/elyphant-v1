
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { getMockProducts, searchMockProducts } from "../services/mockProductService";
import { toast } from "sonner";

// Default search terms to load if no query is provided
const DEFAULT_SEARCH_TERMS = ["gift ideas", "popular gifts", "trending products"];

export const useMarketplaceProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading: contextLoading, setProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Ensure we always load products on initial render
  useEffect(() => {
    console.log("useMarketplaceProducts: Initial load effect running");
    const loadInitialProducts = async () => {
      const keyword = searchParams.get("search") || "";
      setSearchTerm(keyword);
      setLocalSearchTerm(keyword);
      
      // Set initial loading state
      setIsSearching(true);
      
      try {
        let mockResults;
        
        // Load products based on search term or default
        if (keyword) {
          console.log("Loading products for search term:", keyword);
          mockResults = searchMockProducts(keyword);
          console.log(`Found ${mockResults.length} products for "${keyword}"`);
        } else {
          // Select a random default search term
          const defaultTerm = DEFAULT_SEARCH_TERMS[Math.floor(Math.random() * DEFAULT_SEARCH_TERMS.length)];
          console.log("Loading default products for:", defaultTerm);
          mockResults = searchMockProducts(defaultTerm);
          if (!mockResults || mockResults.length === 0) {
            console.log("No search results for default term, using general mock products");
            mockResults = getMockProducts(12);
          }
          console.log(`Found ${mockResults.length} default products`);
        }
        
        // Ensure we have images for each product
        const productsWithImages = mockResults.map(product => {
          if (!product.image || product.image === "/placeholder.svg") {
            return {
              ...product,
              image: `https://placehold.co/600x400?text=${encodeURIComponent(product.title || "Product")}`,
              images: [
                `https://placehold.co/600x400?text=${encodeURIComponent(product.title || "Product")}`,
                `https://placehold.co/600x400?text=${encodeURIComponent("Alt View")}`
              ]
            };
          }
          return product;
        });
        
        setProducts(productsWithImages);
      } catch (error) {
        console.error("Error loading products:", error);
        // Ensure we have some products even if there's an error
        const fallbackProducts = getMockProducts(6);
        setProducts(fallbackProducts);
        toast.error("Error loading products");
      } finally {
        // Complete loading after a short delay for a smoother UX
        setTimeout(() => {
          setIsSearching(false);
          setInitialLoadComplete(true);
        }, 300);
      }
    };

    loadInitialProducts();
  }, []); // Only run once on component mount

  // Handle search term changes from URL
  useEffect(() => {
    const urlSearchTerm = searchParams.get("search") || "";
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
      setLocalSearchTerm(urlSearchTerm);
      
      // Only trigger a new search if the term actually changed
      if (urlSearchTerm) {
        setIsSearching(true);
        
        setTimeout(() => {
          const results = searchMockProducts(urlSearchTerm);
          
          if (results.length === 0) {
            setProducts(getMockProducts(5));
          } else {
            // Ensure all products have images
            const resultsWithImages = results.map(product => {
              if (!product.image || product.image === "/placeholder.svg") {
                return {
                  ...product,
                  image: `https://placehold.co/600x400?text=${encodeURIComponent(product.title || "Product")}`,
                  images: [
                    `https://placehold.co/600x400?text=${encodeURIComponent(product.title || "Product")}`,
                    `https://placehold.co/600x400?text=${encodeURIComponent("Alt View")}`
                  ]
                };
              }
              return product;
            });
            
            setProducts(resultsWithImages);
          }
          
          setIsSearching(false);
        }, 300);
      }
    }
  }, [searchParams, setProducts]);

  const handleSearch = (term: string) => {
    if (term.trim()) {
      setIsSearching(true);
      const params = new URLSearchParams(searchParams);
      params.set("search", term);
      setSearchParams(params);
      
      // Simulate search delay for a more realistic experience
      setTimeout(() => {
        let results = searchMockProducts(term);
        
        // Always ensure we have at least some products
        if (results.length === 0) {
          results = getMockProducts(5);
        }
        
        // Ensure all products have images
        const resultsWithImages = results.map(product => {
          if (!product.image || product.image === "/placeholder.svg") {
            return {
              ...product,
              image: `https://placehold.co/600x400?text=${encodeURIComponent(product.title || "Product")}`,
              images: [
                `https://placehold.co/600x400?text=${encodeURIComponent(product.title || "Product")}`,
                `https://placehold.co/600x400?text=${encodeURIComponent("Alt View")}`
              ]
            };
          }
          return product;
        });
        
        setProducts(resultsWithImages);
        setIsSearching(false);
      }, 300);
    }
  };

  console.log("useMarketplaceProducts state:", {
    productsCount: products?.length || 0,
    isLoading: contextLoading || isSearching,
    initialLoadComplete,
    searchTerm
  });

  return {
    searchTerm,
    localSearchTerm,
    setLocalSearchTerm,
    handleSearch,
    isLoading: contextLoading || isSearching,
    initialLoadComplete,
    products
  };
};
