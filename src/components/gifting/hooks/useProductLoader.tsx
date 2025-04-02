
import { useState, useEffect } from "react";
import { Product, useProducts } from "@/contexts/ProductContext";
import { loadMockProducts, loadSavedProducts } from "../utils/productLoader";

export const useProductLoader = (initialProducts: Product[] = []) => {
  const { products: contextProducts, isLoading: contextLoading } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (contextProducts && contextProducts.length > 0) {
      setProducts(contextProducts);
      setIsLoading(false);
      return;
    }
    
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      setIsLoading(false);
      return;
    }
    
    const savedProducts = loadSavedProducts();
    if (savedProducts) {
      setProducts(savedProducts);
      setIsLoading(false);
      return;
    }
    
    const timer = setTimeout(() => {
      const mockProducts = loadMockProducts();
      setProducts(mockProducts);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [contextProducts, initialProducts]);

  return {
    products,
    isLoading
  };
};
