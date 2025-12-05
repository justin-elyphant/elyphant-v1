import { useCallback, useState } from "react";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { Product } from "@/types/product";
import { CategorySearchService } from "@/services/categoryRegistry/CategorySearchService";

export const useNicoleProductCuration = () => {
  const { searchProducts } = useUnifiedSearch({ maxResults: 24 });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curateByKeywords = useCallback(async (keywords: string, options?: { priceMin?: number; priceMax?: number; category?: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      let results: Product[] = [];
      
      // Check if we have a category that can use enhanced search
      if (options?.category && CategorySearchService.isSupportedCategory(options.category)) {
        console.log(`[Nicole] Using enhanced category search for: ${options.category}`);
        try {
        results = await CategorySearchService.searchCategory(options.category, keywords, {
            limit: 24,
            minPrice: options.priceMin,
            maxPrice: options.priceMax
          });
        } catch (categoryError) {
          console.warn(`[Nicole] Category search failed, falling back to keyword search:`, categoryError);
          // Fall through to regular search
        }
      }
      
      // Fallback to regular unified search if category search didn't work or no category
      if (results.length === 0) {
        console.log(`[Nicole] Using unified search for keywords: ${keywords}`);
        results = await searchProducts(keywords, {
          maxResults: 24,
          filters: {
            priceMin: options?.priceMin,
            priceMax: options?.priceMax,
          }
        } as any);
      }
      
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
