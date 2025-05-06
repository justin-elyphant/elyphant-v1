import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { loadMockProducts, loadSavedProducts } from "@/components/gifting/utils/productLoader";
import { generateDescription } from "@/components/marketplace/zinc/utils/descriptions/descriptionGenerator";

import { supabase } from '@/integrations/supabase/client';
// Product type definition (matches existing type in ProductGallery)
export type Product = {
  addon?: boolean;
  brand?: string;
  fresh?: boolean;
  image: string;
  num_offers_estimate?: null|number;
  num_reviews?: number;
  num_sales?: number;
  pantry?: boolean;
  price: number;
  prime?: boolean;
  product_details?: any[];
  product_id: string;
  stars?: number;
  title: string;
  category_name?: string;
  
  // Additional fields for compatibility
  id?: string | number; // Alias for product_id
  name?: string; // Alias for title
  category?: string; // Alias for category_name
  description?: string;
  vendor?: string;
  retailer?: string; 
  rating?: number; // Alias for stars
  reviewCount?: number; // Alias for num_reviews
  isBestSeller?: boolean;
  variants?: string[];
};

type ProductContextType = {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadProducts: (query) => Promise<void>;
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

// Helper function to normalize Product objects to ensure all required fields are present
export const normalizeProduct = (product: Partial<Product>): Product => {
  const normalized: Product = {
    // Ensure required fields exist with fallbacks
    product_id: product.product_id || String(product.id || ''),
    title: product.title || product.name || 'Untitled Product',
    price: typeof product.price === 'number' ? product.price : 0,
    image: product.image || '',
    
    // Set up aliases for compatibility
    id: product.id || product.product_id,
    name: product.name || product.title,
    category: product.category || product.category_name || 'Uncategorized',
    rating: product.rating || product.stars || 0,
    reviewCount: product.reviewCount || product.num_reviews || 0,
    
    // Copy other fields if present
    brand: product.brand,
    description: product.description,
    vendor: product.vendor || product.retailer || 'Amazon',
    retailer: product.retailer || product.vendor,
    addon: product.addon,
    fresh: product.fresh,
    num_offers_estimate: product.num_offers_estimate,
    num_sales: product.num_sales,
    pantry: product.pantry,
    prime: product.prime,
    stars: product.stars || product.rating,
    num_reviews: product.num_reviews || product.reviewCount,
    category_name: product.category_name || product.category,
    product_details: product.product_details || [],
    isBestSeller: product.isBestSeller || (product.num_sales ? product.num_sales > 1000 : false)
  };
  
  return normalized;
};

// Helper function to normalize an array of products
export const normalizeProducts = (products: Partial<Product>[]): Product[] => {
  return products.map(normalizeProduct);
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load products when context is initialized
  useEffect(() => {
  }, []);
  
  const loadProducts = async (query) => {
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
      const normalizedProducts = normalizeProducts(data.results);
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
