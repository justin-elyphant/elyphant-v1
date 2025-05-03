import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/types/product";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { toast } from "sonner";

interface ProductContextProps {
  products: Product[];
  isLoading: boolean;
  loadProducts: ({ category, keyword }: { category?: string | null; keyword?: string; }) => Promise<void>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductContext = createContext<ProductContextProps | undefined>(undefined);

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initial load of products (you can adjust the criteria as needed)
    loadProducts({});
  }, []);

  const loadProducts = async ({ category = null, keyword = "" }: { category?: string | null; keyword?: string; }) => {
    setIsLoading(true);
    try {
      let fetchedProducts: Product[] = [];
      
      // If we have a keyword, search for products using the Zinc API
      if (keyword && keyword.trim() !== "") {
        console.log(`Loading products with search keyword: "${keyword}"`);
        const zincResults = await searchProducts(keyword);
        
        if (zincResults && zincResults.length > 0) {
          console.log(`Found ${zincResults.length} products from Zinc search`);
          fetchedProducts = zincResults;
        } else {
          console.log("No results from Zinc search, using fallback mock products");
          fetchedProducts = getMockProducts();
        }
      } else {
        console.log("No search keyword provided, using fallback mock products");
        fetchedProducts = getMockProducts();
      }
      
      // If we have a category filter, apply it
      if (category && category !== "all" && category !== null) {
        fetchedProducts = fetchedProducts.filter(product => 
          product.category && product.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Error loading products", {
        description: "There was a problem fetching the products. Displaying mock data instead."
      });
      
      // Fallback to mock products if the API call fails
      setProducts(getMockProducts());
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate mock products as a fallback
  const getMockProducts = (): Product[] => {
    return [
      {
        id: "1",
        name: "Cozy Knit Sweater",
        price: 59.99,
        image: "/images/products/sweater.jpg",
        rating: 4.5,
        reviewCount: 82,
        vendor: "Fashion Forward",
        category: "Clothing",
        description: "Stay warm and stylish in this comfortable knit sweater.",
        variants: ["Small", "Medium", "Large"],
        isBestSeller: true,
      },
      {
        id: "2",
        name: "Wireless Noise Cancelling Headphones",
        price: 249.00,
        image: "/images/products/headphones.jpg",
        rating: 4.8,
        reviewCount: 155,
        vendor: "Tech Gadgets",
        category: "Electronics",
        description: "Immerse yourself in sound with these high-quality noise cancelling headphones.",
      },
      {
        id: "3",
        name: "Ceramic Coffee Mug Set",
        price: 29.99,
        image: "/images/products/mug.jpg",
        rating: 4.2,
        reviewCount: 68,
        vendor: "Home Essentials",
        category: "Home & Kitchen",
        description: "Enjoy your morning coffee in these stylish ceramic mugs.",
      },
      {
        id: "4",
        name: "Leather Crossbody Bag",
        price: 79.99,
        image: "/images/products/bag.jpg",
        rating: 4.6,
        reviewCount: 112,
        vendor: "Luxury Handbags",
        category: "Fashion",
        description: "Carry your essentials in this elegant leather crossbody bag.",
      },
      {
        id: "5",
        name: "Running Shoes",
        price: 89.99,
        image: "/images/products/shoes.jpg",
        rating: 4.4,
        reviewCount: 95,
        vendor: "Athletic Gear",
        category: "Sports & Outdoors",
        description: "Achieve your fitness goals with these comfortable running shoes.",
      },
      {
        id: "6",
        name: "Gourmet Chocolate Gift Box",
        price: 39.99,
        image: "/images/products/chocolate.jpg",
        rating: 4.7,
        reviewCount: 130,
        vendor: "Sweet Treats",
        category: "Food & Beverage",
        description: "Indulge in a selection of gourmet chocolates with this delightful gift box.",
      },
      {
        id: "7",
        name: "Smart Watch Series 7",
        price: 349.00,
        image: "/images/products/watch.jpg",
        rating: 4.9,
        reviewCount: 188,
        vendor: "Tech Gadgets",
        category: "Electronics",
        description: "Stay connected and track your fitness with this advanced smartwatch.",
      },
      {
        id: "8",
        name: "Essential Oil Diffuser",
        price: 49.99,
        image: "/images/products/diffuser.jpg",
        rating: 4.3,
        reviewCount: 75,
        vendor: "Wellness Wonders",
        category: "Health & Wellness",
        description: "Create a relaxing atmosphere with this essential oil diffuser.",
      },
      {
        id: "9",
        name: "Graphic T-Shirt",
        price: 24.99,
        image: "/images/products/tshirt.jpg",
        rating: 4.1,
        reviewCount: 55,
        vendor: "Trendy Threads",
        category: "Clothing",
        description: "Express yourself with this stylish graphic t-shirt.",
      },
      {
        id: "10",
        name: "Portable Bluetooth Speaker",
        price: 69.99,
        image: "/images/products/speaker.jpg",
        rating: 4.5,
        reviewCount: 102,
        vendor: "Audio Zone",
        category: "Electronics",
        description: "Enjoy your favorite music on the go with this portable Bluetooth speaker.",
      },
    ];
  };

  return (
    <ProductContext.Provider value={{ products, isLoading, loadProducts, setProducts }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
