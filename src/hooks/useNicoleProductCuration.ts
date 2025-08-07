import { useCallback, useState } from "react";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { Product } from "@/types/product";

export const useNicoleProductCuration = () => {
  const { searchProducts } = useUnifiedSearch({ maxResults: 24 });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curateByKeywords = useCallback(async (keywords: string, options?: { priceMin?: number; priceMax?: number }) => {
    try {
      setLoading(true);
      setError(null);
      const results = await searchProducts(keywords, {
        maxResults: 24,
        filters: {
          priceMin: options?.priceMin,
          priceMax: options?.priceMax,
        }
      } as any);
      setProducts(results);
      return results;
    } catch (e: any) {
      setError(e?.message || "Search failed");
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchProducts]);

  return { products, loading, error, curateByKeywords };
};
