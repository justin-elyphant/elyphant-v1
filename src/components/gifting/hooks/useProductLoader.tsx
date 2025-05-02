
import { useState, useEffect } from "react";
import { useProducts } from "@/contexts/ProductContext";
import { Product } from "@/types/product";
import { loadMockProducts, loadSavedProducts } from "../utils/productLoader";
import { toast } from "sonner";

export const useProductLoader = (initialProducts: Product[] = []) => {
  const { products: contextProducts, isLoading: contextLoading, setProducts: setContextProducts } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      console.log("Loading products:", { 
        contextProductsLength: contextProducts?.length || 0,
        initialProductsLength: initialProducts?.length || 0
      });
      
      // First priority: Use products from context (if available)
      if (contextProducts && contextProducts.length > 0) {
        console.log("Using products from context:", contextProducts.length);
        setProducts(contextProducts);
        setIsLoading(false);
        return;
      }
      
      // Second priority: Use initial products passed as props
      if (initialProducts && initialProducts.length > 0) {
        console.log("Using initial products:", initialProducts.length);
        setProducts(initialProducts);
        // Also update context to make these products available app-wide
        setContextProducts(initialProducts);
        setIsLoading(false);
        return;
      }
      
      // Third priority: Try to load from localStorage
      const savedProducts = loadSavedProducts();
      if (savedProducts && savedProducts.length > 0) {
        console.log("Using saved products from localStorage:", savedProducts.length);
        setProducts(savedProducts);
        // Also update context to make these products available app-wide
        setContextProducts(savedProducts);
        setIsLoading(false);
        return;
      }
      
      // Last resort: Load mock products
      console.log("Loading mock products");
      setTimeout(() => {
        const mockProducts = loadMockProducts();
        console.log("Loaded mock products:", mockProducts.length);
        if (mockProducts && mockProducts.length > 0) {
          setProducts(mockProducts);
          // Also update context to make these products available app-wide
          setContextProducts(mockProducts);
          toast.success(`Loaded ${mockProducts.length} products`);
        } else {
          console.error("Failed to load mock products or empty array returned");
          toast.error("Failed to load products. Please try refreshing the page.");
        }
        setIsLoading(false);
      }, 500);
    };

    loadProducts();
  }, [contextProducts, initialProducts, setContextProducts]);

  // Log when products state changes
  useEffect(() => {
    console.log(`useProductLoader: products state updated with ${products.length} products`);
  }, [products]);

  return {
    products,
    isLoading
  };
};
