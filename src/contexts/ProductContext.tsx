
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { loadMockProducts, loadSavedProducts } from "@/components/gifting/utils/productLoader";
import { generateDescription } from "@/components/marketplace/zinc/utils/descriptions/descriptionGenerator";
import { normalizeProduct } from "@/components/marketplace/product-item/productUtils";

import { supabase } from '@/integrations/supabase/client';

// Extended Product type definition with all properties being used across the app
export type Product = {
  // Original properties from ZincProduct
  id: number | string;
  product_id: string;
  title?: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
  category?: string;
  vendor?: string;
  brand?: string;
  
  // Review related properties
  stars?: number;
  rating?: number;
  num_reviews?: number;
  reviewCount?: number;
  
  // UI flags and additional properties
  isBestSeller?: boolean;
  variants?: string[];
  addon?: boolean;
  fresh?: boolean;
  num_offers_estimate?: null|number;
  num_sales?: number;
  pantry?: boolean;
  prime?: boolean;
  product_details?: any[];
};

type ProductContextType = {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadProducts: (query: { keyword: string }) => Promise<void>;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Helper function to generate mock features for products
const generateMockFeatures = (productName: string, category: string): string[] => {
  const features = [
    `Premium ${category.toLowerCase()} for everyday use`,
    `Enhanced durability and reliability`,
    `Stylish design perfect for any setting`,
    `Easy to clean and maintain`
  ];
  
  // Add some category-specific features
  if (category === "Electronics") {
    features.push("Energy efficient technology");
    features.push("Smart connectivity options");
  } else if (category === "Clothing") {
    features.push("Breathable fabric for all-day comfort");
    features.push("Machine washable");
  } else if (category === "Footwear") {
    features.push("Cushioned insole for maximum comfort");
    features.push("Non-slip outsole for better traction");
  }
  
  return features;
};

// Helper function to generate mock specifications
const generateMockSpecifications = (productName: string, category: string): Record<string, string> => {
  const specs: Record<string, string> = {
    "Brand": productName.split(' ')[0],
    "Material": "Premium quality",
    "Origin": "Imported"
  };
  
  // Add some category-specific specifications
  if (category === "Electronics") {
    specs["Power"] = "110-240V";
    specs["Warranty"] = "1 year";
  } else if (category === "Clothing") {
    specs["Fabric"] = "Cotton blend";
    specs["Care"] = "Machine wash cold";
  } else if (category === "Footwear") {
    specs["Upper"] = "Synthetic leather";
    specs["Sole"] = "Rubber";
  }
  
  return specs;
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadProducts = async (query: { keyword: string }) => {
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
      
      // Map and normalize the API results to ensure type consistency
      const mappedProducts = data.results.map((product: any) => normalizeProduct(product));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error("Error loading products:", error);
      // Load fallback products
      const mockProducts = loadMockProducts().map(product => normalizeProduct({
        ...product,
        product_id: product.id.toString()
      }));
      setProducts(mockProducts);
    } finally {
      setIsLoading(false);
    }
  };

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
