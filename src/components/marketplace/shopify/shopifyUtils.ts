
import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { ShopifyConnection, SyncSettings } from "./types";

// Base URL for the Shopify Admin API
const SHOPIFY_API_VERSION = "2023-10";

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

// Connect to a Shopify store and authenticate
export const connectToShopify = async (storeUrl: string): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // In a real implementation, this would use Shopify's OAuth flow
    // For now, we'll simulate a connection with a mock successful response
    
    // This is where you would normally exchange the auth code for an access token
    console.log(`Connecting to Shopify store: ${storeUrl}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo purposes, check if the URL looks valid
    if (!storeUrl.includes('.myshopify.com') && !storeUrl.endsWith('.com') && !storeUrl.endsWith('.store')) {
      return { 
        success: false, 
        message: "Please enter a valid Shopify store URL (e.g., yourstore.myshopify.com)"
      };
    }
    
    // Mock successful response
    return {
      success: true,
      message: "Successfully connected to Shopify store",
      data: {
        shop: storeUrl,
        accessToken: "mock_token_for_demo",
        scopes: ["read_products", "write_orders"]
      }
    };
  } catch (error) {
    console.error("Error connecting to Shopify:", error);
    return {
      success: false,
      message: "Failed to connect to Shopify. Please try again later."
    };
  }
};

// Fetch products from a connected Shopify store
export const fetchShopifyProducts = async (storeUrl: string, syncSettings: SyncSettings): Promise<Product[] | null> => {
  try {
    console.log(`Fetching products from Shopify store: ${storeUrl}`);
    console.log("Sync settings:", syncSettings);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would call the Shopify API
    // For now, generate more realistic mock products
    const products = generateShopifyProductsFromRealData();
    
    // Apply markup based on sync settings
    if (syncSettings.markup > 0) {
      return products.map(product => ({
        ...product,
        price: product.price * (1 + (syncSettings.markup / 100))
      }));
    }
    
    return products;
  } catch (error) {
    console.error("Error fetching Shopify products:", error);
    toast.error("Failed to fetch products from Shopify");
    return null;
  }
};

// Generate more realistic mock products
export const generateShopifyProductsFromRealData = (): Product[] => {
  // These would normally come from the Shopify API
  const mockProducts: Product[] = [
    {
      id: 101,
      name: "Premium Noise-Cancelling Headphones",
      price: 249.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
      vendor: "Shopify",
      variants: ["Matte Black", "Silver", "Navy Blue"],
      description: "High-end wireless headphones with active noise cancellation and 30-hour battery life"
    },
    {
      id: 102,
      name: "Fitness Smartwatch Pro",
      price: 299.99,
      category: "Wearables",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
      vendor: "Shopify",
      variants: ["Black", "White", "Rose Gold"],
      description: "Advanced fitness tracker with heart rate monitoring, GPS, and 7-day battery life"
    },
    {
      id: 103,
      name: "Organic Soy Wax Candle Set",
      price: 42.99,
      category: "Home",
      image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
      vendor: "Shopify",
      variants: ["Lavender & Sage", "Sandalwood", "Vanilla Bean"],
      description: "Set of 3 hand-poured organic soy wax candles with wooden wicks"
    },
    {
      id: 104,
      name: "Leather Laptop Sleeve",
      price: 79.99,
      category: "Accessories",
      image: "https://images.unsplash.com/photo-1551739440-5dd934d3a94a?w=500&q=80",
      vendor: "Shopify",
      variants: ["Rustic Brown", "Black", "Tan"],
      description: "Premium full-grain leather sleeve for 13-inch laptops with magnetic closure"
    },
    {
      id: 105,
      name: "Plant-Based Protein Powder",
      price: 39.99,
      category: "Nutrition",
      image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&q=80",
      vendor: "Shopify",
      variants: ["Chocolate", "Vanilla", "Unflavored"],
      description: "Organic plant-based protein with 25g protein per serving, no artificial ingredients"
    },
    {
      id: 106,
      name: "Minimalist Wall Clock",
      price: 65.99,
      category: "Home Decor",
      image: "https://images.unsplash.com/photo-1507994689336-2c0a7aca3631?w=500&q=80",
      vendor: "Shopify",
      variants: ["Natural Wood", "Black", "White"],
      description: "Scandinavian-inspired wall clock with silent mechanism"
    },
    {
      id: 107,
      name: "Handcrafted Ceramic Mug Set",
      price: 48.00,
      category: "Kitchen",
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80", 
      vendor: "Shopify",
      variants: ["Speckled White", "Terracotta", "Ocean Blue"],
      description: "Set of 4 handmade stoneware mugs, each uniquely crafted"
    },
    {
      id: 108,
      name: "Lightweight Running Shoes",
      price: 129.99,
      category: "Footwear",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
      vendor: "Shopify",
      variants: ["Black/White", "Blue/Gray", "All Black"],
      description: "Ultra-lightweight running shoes with responsive cushioning"
    },
    {
      id: 109,
      name: "Organic Cotton Throw Blanket",
      price: 89.99,
      category: "Home",
      image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500&q=80",
      vendor: "Shopify",
      variants: ["Natural", "Slate Gray", "Dusty Pink"],
      description: "100% organic cotton throw blanket, ethically made"
    },
    {
      id: 110,
      name: "Stainless Steel Water Bottle",
      price: 34.99,
      category: "Accessories",
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80",
      vendor: "Shopify",
      variants: ["Matte Black", "Brushed Steel", "Ocean Blue"],
      description: "Vacuum insulated bottle keeps drinks cold for 24 hours, hot for 12 hours"
    },
    {
      id: 111,
      name: "Natural Bamboo Toothbrush Set",
      price: 18.99,
      category: "Personal Care",
      image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&q=80",
      vendor: "Shopify",
      variants: ["Adult", "Child", "Family Pack"],
      description: "Pack of 4 biodegradable bamboo toothbrushes with charcoal-infused bristles"
    },
    {
      id: 112,
      name: "Handwoven Market Basket",
      price: 45.00,
      category: "Home",
      image: "https://images.unsplash.com/photo-1631125915902-d9597523a363?w=500&q=80",
      vendor: "Shopify",
      variants: ["Natural", "Black Trim", "Colorful Pattern"],
      description: "Fair-trade handwoven basket, perfect for shopping or storage"
    }
  ];
  
  return mockProducts;
};

// Default mock products (simpler version)
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
