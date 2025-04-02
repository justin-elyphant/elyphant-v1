
import { useState, useEffect } from "react";
import { Product, useProducts } from "@/contexts/ProductContext";
import { loadMockProducts, loadSavedProducts } from "../utils/productLoader";

export const useProductLoader = (initialProducts: Product[] = []) => {
  const { products: contextProducts, isLoading: contextLoading } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      console.log("Loading products:", { 
        contextProductsLength: contextProducts?.length || 0,
        initialProductsLength: initialProducts?.length || 0
      });
      
      if (contextProducts && contextProducts.length > 0) {
        console.log("Using products from context");
        setProducts(contextProducts);
        setIsLoading(false);
        return;
      }
      
      if (initialProducts && initialProducts.length > 0) {
        console.log("Using initial products");
        setProducts(initialProducts);
        setIsLoading(false);
        return;
      }
      
      const savedProducts = loadSavedProducts();
      if (savedProducts && savedProducts.length > 0) {
        console.log("Using saved products from localStorage");
        setProducts(savedProducts);
        setIsLoading(false);
        return;
      }
      
      // Simulate a network request
      console.log("Loading mock products");
      setTimeout(() => {
        const mockProducts = loadMockProducts();
        console.log("Loaded mock products:", mockProducts.length);
        if (mockProducts && mockProducts.length > 0) {
          setProducts(mockProducts);
        } else {
          console.error("Failed to load mock products or empty array returned");
        }
        setIsLoading(false);
      }, 800); // Slightly reduced timeout for testing
    };

    loadProducts();
  }, [contextProducts, initialProducts]);

  // Log when products state changes
  useEffect(() => {
    console.log(`useProductLoader: products state updated with ${products.length} products`);
  }, [products]);

  return {
    products,
    isLoading
  };
};
