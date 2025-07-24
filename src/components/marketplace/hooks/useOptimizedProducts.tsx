
import { useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface UseOptimizedProductsProps {
  initialProducts: Product[];
  pageSize?: number;
  onLoadMore?: (page: number) => Promise<Product[]>;
  hasMoreFromServer?: boolean;
}

interface UseOptimizedProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
  totalCount: number;
  currentPage: number;
}

export const useOptimizedProducts = ({
  initialProducts,
  pageSize = 20,
  onLoadMore,
  hasMoreFromServer = false
}: UseOptimizedProductsProps): UseOptimizedProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize products from initial data
  useEffect(() => {
    setProducts(initialProducts);
    setCurrentPage(1);
  }, [initialProducts]);

  const hasMore = useMemo(() => {
    const result = onLoadMore ? hasMoreFromServer : currentPage * pageSize < initialProducts.length;
    console.log('useOptimizedProducts hasMore calculation:', {
      onLoadMore: !!onLoadMore,
      hasMoreFromServer,
      currentPage,
      pageSize,
      initialProductsLength: initialProducts.length,
      result
    });
    return result;
  }, [onLoadMore, hasMoreFromServer, currentPage, pageSize, initialProducts.length]);

  const loadMore = useCallback(async () => {
    console.log('loadMore called:', { hasMore, isLoading });
    if (!hasMore || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (onLoadMore) {
        // Server-side pagination
        const newProducts = await onLoadMore(currentPage + 1);
        console.log('Server pagination result:', { newProducts: newProducts.length, currentPage: currentPage + 1 });
        
        if (newProducts.length > 0) {
          setProducts(prev => [...prev, ...newProducts]);
          setCurrentPage(prev => prev + 1);
        }
        
        // Update hasMoreFromServer based on whether we got a full page
        // Note: This would require a state update mechanism, for now we'll assume more pages exist
      } else {
        // Client-side pagination fallback
        setCurrentPage(prev => prev + 1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load more products";
      setError(errorMessage);
      toast.error("Failed to load more products");
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, onLoadMore, currentPage]);

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
    totalCount: products.length,
    currentPage
  };
};
