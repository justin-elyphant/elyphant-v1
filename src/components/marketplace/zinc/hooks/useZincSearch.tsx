
import { useState } from "react";
import { searchProducts } from "../zincService";
import { ZincProduct } from "../types";
import { toast } from "@/hooks/use-toast";

export const useZincSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (term: string): Promise<ZincProduct[]> => {
    if (!term.trim()) return [];
    
    setIsLoading(true);
    setSearchTerm(term);
    console.log(`useZincSearch: Searching for "${term}"`);
    
    try {
      const results = await searchProducts(term);
      console.log(`useZincSearch: Found ${results.length} results for "${term}"`);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: `No products found for "${term}"`,
          variant: "destructive"
        });
      }
      
      return results;
    } catch (err) {
      console.error("Error searching products:", err);
      setError("Failed to search products");
      toast({
        title: "Search Error",
        description: "Failed to search products. Please try again.",
        variant: "destructive"
      });
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
    error
  };
};
