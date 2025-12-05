import { useCallback, useState } from "react";
import { Product } from "@/types/product";
import { productCatalogService } from "@/services/ProductCatalogService";

export const useNicoleProductCuration = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curateByKeywords = useCallback(async (keywords: string, options?: { priceMin?: number; priceMax?: number; category?: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[Nicole] Using ProductCatalogService for keywords: ${keywords}`);
      const response = await productCatalogService.searchProducts(keywords, {
        category: options?.category,
        limit: 24,
        filters: {
          minPrice: options?.priceMin,
          maxPrice: options?.priceMax,
        }
      });
      
      const results = response.products as Product[];
      setProducts(results);
      return results;
    } catch (e: any) {
      setError(e?.message || "Search failed");
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, curateByKeywords };
};
