
import { useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface UseOptimizedProductsProps {
  initialProducts: Product[];
  pageSize?: number;
}

interface UseOptimizedProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
  totalCount: number;
}

export const useOptimizedProducts = ({
  initialProducts,
  pageSize = 20
}: UseOptimizedProductsProps): UseOptimizedProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Memoize paginated products to prevent unnecessary recalculations
  const paginatedProducts = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * pageSize;
    return initialProducts.slice(startIndex, endIndex);
  }, [initialProducts, currentPage, pageSize]);

  // Update products when pagination changes
  useEffect(() => {
    setProducts(paginatedProducts);
  }, [paginatedProducts]);

  // Reset pagination when initial products change
  useEffect(() => {
    setCurrentPage(1);
    setError(null);
  }, [initialProducts]);

  const hasMore = useMemo(() => {
    return currentPage * pageSize < initialProducts.length;
  }, [currentPage, pageSize, initialProducts.length]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, isLoading]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate refresh delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentPage(1);
      toast.success("Products refreshed");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh products";
      setError(errorMessage);
      toast.error("Failed to refresh products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    products,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount: initialProducts.length
  };
};
