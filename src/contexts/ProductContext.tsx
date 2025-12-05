
import React, { createContext, useContext, useState, ReactNode } from "react";
import { standardizeProduct } from "@/components/marketplace/product-item/productUtils";
import { productCatalogService } from "@/services/ProductCatalogService";

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
  
  // Enhanced Zinc API variation fields
  variant_specifics?: Array<{
    dimension: string;
    value: string;
  }>;
  all_variants?: Array<{
    variant_specifics: Array<{
      dimension: string;
      value: string;
    }>;
    product_id: string;
  }>;
  main_image?: string;
  feature_bullets?: string[];
  product_description?: string;
  categories?: string[];
  authors?: string[];
  original_retail_price?: number;
  question_count?: number;
  asin?: string;
  handmade?: boolean;
  digital?: boolean;
  hasVariations?: boolean;
  
  // New fields for wishlist and preference tracking
  tags?: string[];
  fromWishlist?: boolean;
  fromPreferences?: boolean;
  
  // CRITICAL: Zinc product identification metadata
  productSource?: 'zinc_api' | 'shopify' | 'vendor_portal' | 'manual';
  isZincApiProduct?: boolean;
  skipCentsDetection?: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
  
  const loadProducts = async (query: {keyword: string}) => {
    const { keyword } = query;
    setIsLoading(true);
    
    try {
      console.log(`[ProductContext] Loading products for keyword: "${keyword}"`);
      
      // Use the ProductCatalogService
      const response = await productCatalogService.searchProducts(keyword, {
        limit: 20
      });
      
      setProducts(response.products);
      console.log(`[ProductContext] Loaded ${response.products.length} products`);
    } catch (err) {
      console.error("Error loading products:", err);
      setProducts([]);
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
