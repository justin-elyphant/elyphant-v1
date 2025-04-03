
import { useState, useRef } from "react";
import { searchProducts } from "../zincService";
import { ZincProduct } from "../types";
import { toast } from "@/hooks/use-toast";

export const useZincSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ZincProduct[]>([]);
  const toastShownRef = useRef(false);

  // Reset toast shown status after 3 seconds
  const resetToastStatus = () => {
    setTimeout(() => {
      toastShownRef.current = false;
    }, 3000);
  };

  const search = async (term: string): Promise<ZincProduct[]> => {
    if (!term.trim()) return [];
    
    setIsLoading(true);
    setSearchTerm(term);
    setError(null);
    console.log(`useZincSearch: Searching for "${term}"`);
    
    try {
      const searchResults = await searchProducts(term);
      console.log(`useZincSearch: Found ${searchResults.length} results for "${term}"`);
      
      // Log sample of image arrays for debugging
      if (searchResults.length > 0) {
        console.log("Sample product images:", {
          mainImage: searchResults[0].image,
          imagesArray: searchResults[0].images
        });
      }
      
      setResults(searchResults);
      
      // Only show toast for empty results and only once per search session
      if (searchResults.length === 0 && !toastShownRef.current) {
        toastShownRef.current = true;
        toast({
          title: "No results found",
          description: `No products found for "${term}"`,
          variant: "destructive",
          id: "no-results" // Use consistent ID to prevent duplicates
        });
        resetToastStatus();
      }
      
      return searchResults;
    } catch (err) {
      console.error("Error searching products:", err);
      setError("Failed to search products");
      
      // Only show error toast once per search session
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        toast({
          title: "Search Error",
          description: "Failed to search products. Please try again.",
          variant: "destructive",
          id: "search-error" // Use consistent ID to prevent duplicates
        });
        resetToastStatus();
      }
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    search,
    searchTerm,
    setSearchTerm,
    isLoading,
    error,
    results
  };
};
