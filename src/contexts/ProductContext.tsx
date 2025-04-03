
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { loadMockProducts, loadSavedProducts } from "@/components/gifting/utils/productLoader";

// Product type definition (matches existing type in ProductGallery)
export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  vendor: string;
  variants?: string[];
  description?: string;
  rating?: number;
  reviewCount?: number;
};

type ProductContextType = {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load products when context is initialized
  useEffect(() => {
    const loadProducts = async () => {
      console.log("ProductContext: Loading products");
      
      // First try to load shopify products
      const shopifyProducts = localStorage.getItem('shopifyProducts');
      if (shopifyProducts) {
        try {
          const parsed = JSON.parse(shopifyProducts);
          console.log(`ProductContext: Loaded ${parsed.length} Shopify products from localStorage`);
          
          // Make sure each product has vendor: "Shopify"
          const shopifyProductsWithVendor = parsed.map((product: Product) => ({
            ...product,
            vendor: "Shopify"
          }));
          
          setProducts(shopifyProductsWithVendor);
          setIsLoading(false);
          return;
        } catch (e) {
          console.error("ProductContext: Error parsing Shopify products:", e);
        }
      } else {
        console.log("ProductContext: No Shopify products found in localStorage");
      }
      
      // If no shopify products, try to load saved products
      const savedProducts = loadSavedProducts();
      if (savedProducts && savedProducts.length > 0) {
        console.log(`ProductContext: Loaded ${savedProducts.length} products from localStorage`);
        setProducts(savedProducts);
        setIsLoading(false);
        return;
      }
      
      // If no saved products, load mock products
      console.log("ProductContext: Loading mock products");
      const mockProducts = loadMockProducts();
      if (mockProducts && mockProducts.length > 0) {
        console.log(`ProductContext: Loaded ${mockProducts.length} mock products`);
        setProducts(mockProducts);
      } else {
        console.error("ProductContext: Failed to load mock products");
      }
      setIsLoading(false);
    };

    loadProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, setProducts, isLoading, setIsLoading }}>
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
