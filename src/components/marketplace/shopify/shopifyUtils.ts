
import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { ShopifyConnection } from "./types";

// Load Shopify products from localStorage
export const loadShopifyProducts = (): Product[] | null => {
  const savedProducts = localStorage.getItem('shopifyProducts');
  if (savedProducts) {
    try {
      const parsedProducts = JSON.parse(savedProducts);
      console.log(`ShopifyIntegration: Loaded ${parsedProducts.length} products from localStorage`);
      
      // Make sure each product has the Shopify vendor
      if (parsedProducts && parsedProducts.length > 0) {
        return parsedProducts.map((product: Product) => ({
          ...product,
          vendor: "Shopify"
        }));
      }
    } catch (e) {
      console.error("Error parsing saved products:", e);
      toast.error("Failed to load saved products");
    }
  }
  return null;
};

// Save Shopify connection to localStorage
export const saveShopifyConnection = (connection: ShopifyConnection): void => {
  localStorage.setItem('shopifyConnection', JSON.stringify(connection));
};

// Load Shopify connection from localStorage
export const loadShopifyConnection = (): ShopifyConnection | null => {
  const savedConnection = localStorage.getItem('shopifyConnection');
  if (savedConnection) {
    try {
      return JSON.parse(savedConnection);
    } catch (e) {
      console.error("Error parsing saved connection:", e);
      return null;
    }
  }
  return null;
};

// Generate mock Shopify products
export const generateMockShopifyProducts = (): Product[] => {
  const mockProducts: Product[] = [
    {
      id: 101,
      name: "Premium Bluetooth Headphones",
      price: 129.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
      vendor: "Shopify",
      variants: ["Black", "White", "Rose Gold"],
      description: "Noise-cancelling bluetooth headphones with 20-hour battery life"
    },
    {
      id: 102,
      name: "Smart Fitness Watch",
      price: 199.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
      vendor: "Shopify",
      variants: ["Black", "Silver", "Blue"],
      description: "Track your fitness goals with this premium smart watch"
    },
    {
      id: 103,
      name: "Luxury Scented Candle Set",
      price: 49.99,
      category: "Home",
      image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
      vendor: "Shopify",
      variants: ["Vanilla", "Lavender", "Sandalwood"],
      description: "Set of 4 premium hand-poured scented candles"
    },
    {
      id: 104,
      name: "Ceramic Pour-Over Coffee Set",
      price: 64.99,
      category: "Home",
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80",
      vendor: "Shopify",
      variants: ["Matte Black", "White", "Terracotta"],
      description: "Complete pour-over coffee brewing kit with ceramic dripper"
    },
    {
      id: 105,
      name: "Handcrafted Leather Wallet",
      price: 79.99,
      category: "Accessories",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80",
      vendor: "Shopify",
      variants: ["Brown", "Black", "Tan"],
      description: "Full-grain leather wallet with RFID protection"
    },
    {
      id: 106,
      name: "Designer Succulent Planter",
      price: 34.99,
      category: "Home",
      image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80",
      vendor: "Shopify",
      variants: ["Small", "Medium", "Large"],
      description: "Geometric concrete planter perfect for succulents and small plants"
    },
  ];
  
  // Ensure vendor is set to "Shopify" for all products
  return mockProducts.map(product => ({
    ...product,
    vendor: "Shopify"
  }));
};
