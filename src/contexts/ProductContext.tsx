
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { loadMockProducts, loadSavedProducts } from "@/components/gifting/utils/productLoader";
import { generateDescription } from "@/components/marketplace/zinc/utils/descriptions/descriptionGenerator";
import { standardizeProduct } from "@/components/marketplace/product-item/productUtils";

import { supabase } from '@/integrations/supabase/client';
// Product type definition (matches existing type in ProductGallery)
export type Product = {
  // Required fields
  product_id: string;
  title: string;
  price: number;
  image: string;
  
  // Fields that may have aliases
  id?: string; // Alias for product_id
  name?: string; // Alias for title
  category?: string; // Alias for category_name
  category_name?: string;
  vendor?: string;
  retailer?: string;
  rating?: number; // Alias for stars
  stars?: number;
  reviewCount?: number; // Alias for num_reviews
  num_reviews?: number;
  
  // Optional fields that might be present in some products
  description?: string;
  brand?: string;
  images?: string[];
  addon?: boolean;
  fresh?: boolean;
  num_offers_estimate?: null|number;
  num_sales?: number;
  pantry?: boolean;
  prime?: boolean;
  product_details?: any[];
  isBestSeller?: boolean;
  variants?: string[];
};

type ProductContextType = {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadProducts: (query: {keyword: string}) => Promise<void>;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Helper function to normalize Product objects to ensure all required fields are present
export const normalizeProduct = (product: Partial<Product>): Product => {
  return standardizeProduct(product) as Product;
};

// Helper function to normalize an array of products
export const normalizeProducts = (products: Partial<Product>[]): Product[] => {
  if (!products || !Array.isArray(products)) {
    console.error("Invalid products array provided to normalizeProducts", products);
    return [];
  }
  return products.map(product => normalizeProduct(product));
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load products when context is initialized
  useEffect(() => {
  }, []);
  
  const loadProducts = async (query: {keyword: string}) => {
    setIsLoading(true);
    const {keyword} = query;
    try {
      const { data, error } = await supabase.functions.invoke("get-products", {
        body: {
          query: keyword,
          page: 1
        }
      });
      
      if (error) throw new Error(error.message);
      
      // Normalize the product data to ensure consistent structure
      const normalizedProducts = normalizeProducts(data?.results || []);
      setProducts(normalizedProducts);
    } catch (err) {
      console.error("Error loading products:", err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ProductContext.Provider value={{ products, setProducts, loadProducts, isLoading, setIsLoading }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
