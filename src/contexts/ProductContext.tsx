
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { loadMockProducts, loadSavedProducts } from "@/components/gifting/utils/productLoader";
import { generateDescription } from "@/components/marketplace/zinc/utils/descriptions/descriptionGenerator";

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
  images?: string[];
  features?: string[];
  specifications?: Record<string, string>;
};

type ProductContextType = {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
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
          
          // Make sure each product has vendor: "Shopify" and enrich with descriptions if missing
          const shopifyProductsWithVendor = parsed.map((product: Product) => ({
            ...product,
            vendor: "Shopify",
            description: product.description || generateDescription(product.name, product.category || "Electronics"),
            images: product.images || [product.image],
            features: product.features || generateMockFeatures(product.name, product.category || "Electronics"),
            specifications: product.specifications || generateMockSpecifications(product.name, product.category || "Electronics")
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
        
        // Enrich saved products with descriptions and images if missing
        const enrichedProducts = savedProducts.map(product => ({
          ...product,
          description: product.description || generateDescription(product.name, product.category || "Electronics"),
          images: product.images || [product.image],
          features: product.features || generateMockFeatures(product.name, product.category || "Electronics"),
          specifications: product.specifications || generateMockSpecifications(product.name, product.category || "Electronics")
        }));
        
        setProducts(enrichedProducts);
        setIsLoading(false);
        return;
      }
      
      // If no saved products, load mock products
      console.log("ProductContext: Loading mock products");
      const mockProducts = loadMockProducts();
      if (mockProducts && mockProducts.length > 0) {
        console.log(`ProductContext: Loaded ${mockProducts.length} mock products`);
        
        // Enrich mock products with descriptions and images if missing
        const enrichedMockProducts = mockProducts.map(product => ({
          ...product,
          description: product.description || generateDescription(product.name, product.category || "Electronics"),
          images: product.images || [product.image],
          features: product.features || generateMockFeatures(product.name, product.category || "Electronics"),
          specifications: product.specifications || generateMockSpecifications(product.name, product.category || "Electronics")
        }));
        
        setProducts(enrichedMockProducts);
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
