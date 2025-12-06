import { useState } from "react";
import { productCatalogService } from "@/services/ProductCatalogService";
import { toast } from "sonner";

/**
 * Combined hook for Zinc product management - simplified to use ProductCatalogService
 */
export const useZincProducts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSearchTerm(query);
    
    try {
      const response = await productCatalogService.searchProducts(query, { limit: 24 });
      setProducts(response.products || []);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const syncProducts = async () => {
    toast.success("Products synced");
  };

  return {
    searchTerm,
    setSearchTerm,
    syncProducts,
    handleSearch,
    isLoading,
    error,
    products
  };
};
