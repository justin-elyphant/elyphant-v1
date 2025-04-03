
import { useState } from "react";
import { searchProducts, ZincProduct } from "../zincService";

export const useZincSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (term: string) => {
    if (!term.trim()) return [];
    
    setIsLoading(true);
    setSearchTerm(term);
    
    try {
      const results = await searchProducts(term);
      return results;
    } catch (err) {
      console.error("Error searching products:", err);
      setError("Failed to search products");
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
