import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { ShopifyConnection, SyncSettings } from "./types";
import { standardizeProduct } from "../product-item/productUtils";

// Base URL for the Shopify Admin API
const SHOPIFY_API_VERSION = "2023-10";

// Load Shopify products from localStorage
export const loadShopifyProducts = (): Product[] | null => {
  const savedProducts = localStorage.getItem('shopifyProducts');
  if (savedProducts) {
    try {
      const parsedProducts = JSON.parse(savedProducts);
      console.log(`ShopifyIntegration: Loaded ${parsedProducts.length} products from localStorage`);
      
      // Make sure each product has the Shopify vendor and is properly standardized
      if (parsedProducts && parsedProducts.length > 0) {
        return parsedProducts.map((product: any) => standardizeProduct({
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
    
    // Detect if this is a development store request
    const isDevelopmentStore = storeUrl.toLowerCase() === "development" || storeUrl.toLowerCase() === "dev";
    
    if (isDevelopmentStore) {
      return {
        success: true,
        message: "Connected to Shopify Development Store",
        data: {
          shop: "development-store.myshopify.com",
          accessToken: "dev_token_for_testing",
          scopes: ["read_products", "write_products", "read_orders", "write_orders"]
        }
      };
    }
    
    // Mock successful response for regular store connections
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
    
    // Check if this is a development store
    const isDevelopmentStore = storeUrl.includes("development");
    
    // For development stores, generate products that look more like test products
    if (isDevelopmentStore) {
      const devProducts = generateDevelopmentStoreProducts();
      
      // Apply markup based on sync settings
      if (syncSettings.markup > 0) {
        return devProducts.map(product => standardizeProduct({
          ...product,
          price: product.price * (1 + (syncSettings.markup / 100))
        }));
      }
      
      return devProducts;
    }
    
    // For regular stores, use our standard mock products
    const products = generateShopifyProductsFromRealData();
    
    // Apply markup based on sync settings
    if (syncSettings.markup > 0) {
      return products.map(product => standardizeProduct({
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

// Generate development store products
export const generateDevelopmentStoreProducts = (): Product[] => {
  const mockProducts = [
    {
      id: 1001,
      product_id: "1001",
      name: "Test Product 1",
      title: "Test Product 1",
      price: 19.99,
      category: "Test Category",
      category_name: "Test Category",
      image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Small", "Medium", "Large"],
      description: "This is a test product for development purposes"
    },
    {
      id: 1002,
      product_id: "1002",
      name: "Test Product 2",
      title: "Test Product 2",
      price: 29.99,
      category: "Test Category",
      category_name: "Test Category",
      image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Red", "Blue", "Green"],
      description: "This is another test product for development purposes"
    },
    {
      id: 1003,
      product_id: "1003",
      name: "Sample Product",
      title: "Sample Product",
      price: 39.99,
      category: "Sample Category",
      category_name: "Sample Category",
      image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Option 1", "Option 2", "Option 3"],
      description: "This is a sample product with multiple options"
    },
    {
      id: 1004,
      product_id: "1004",
      name: "Development Item",
      title: "Development Item",
      price: 49.99,
      category: "Development",
      category_name: "Development",
      image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Test Variant"],
      description: "A development item for testing the store functionality"
    },
    {
      id: 1005,
      product_id: "1005",
      name: "API Test Product",
      title: "API Test Product",
      price: 59.99,
      category: "API Testing",
      category_name: "API Testing",
      image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Default"],
      description: "Used for testing API integration"
    }
  ];
  
  return mockProducts.map(product => standardizeProduct(product));
};

// Generate more realistic mock products
export const generateShopifyProductsFromRealData = (): Product[] => {
  // These would normally come from the Shopify API
  const mockProducts = [
    {
      id: 101,
      product_id: "101",
      name: "Premium Noise-Cancelling Headphones",
      title: "Premium Noise-Cancelling Headphones",
      price: 249.99,
      category: "Electronics",
      category_name: "Electronics",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Matte Black", "Silver", "Navy Blue"],
      description: "High-end wireless headphones with active noise cancellation and 30-hour battery life"
    },
    {
      id: 102,
      product_id: "102",
      name: "Fitness Smartwatch Pro",
      title: "Fitness Smartwatch Pro",
      price: 299.99,
      category: "Wearables",
      category_name: "Wearables",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Black", "White", "Rose Gold"],
      description: "Advanced fitness tracker with heart rate monitoring, GPS, and 7-day battery life"
    },
    {
      id: 103,
      product_id: "103",
      name: "Organic Soy Wax Candle Set",
      title: "Organic Soy Wax Candle Set",
      price: 42.99,
      category: "Home",
      category_name: "Home",
      image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Lavender & Sage", "Sandalwood", "Vanilla Bean"],
      description: "Set of 3 hand-poured organic soy wax candles with wooden wicks"
    },
    {
      id: 104,
      product_id: "104",
      name: "Leather Laptop Sleeve",
      title: "Leather Laptop Sleeve",
      price: 79.99,
      category: "Accessories",
      category_name: "Accessories",
      image: "https://images.unsplash.com/photo-1551739440-5dd934d3a94a?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Rustic Brown", "Black", "Tan"],
      description: "Premium full-grain leather sleeve for 13-inch laptops with magnetic closure"
    },
    {
      id: 105,
      product_id: "105",
      name: "Plant-Based Protein Powder",
      title: "Plant-Based Protein Powder",
      price: 39.99,
      category: "Nutrition",
      category_name: "Nutrition",
      image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Chocolate", "Vanilla", "Unflavored"],
      description: "Organic plant-based protein with 25g protein per serving, no artificial ingredients"
    },
    {
      id: 106,
      product_id: "106",
      name: "Minimalist Wall Clock",
      title: "Minimalist Wall Clock",
      price: 65.99,
      category: "Home Decor",
      category_name: "Home Decor",
      image: "https://images.unsplash.com/photo-1507994689336-2c0a7aca3631?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Natural Wood", "Black", "White"],
      description: "Scandinavian-inspired wall clock with silent mechanism"
    },
    {
      id: 107,
      product_id: "107",
      name: "Handcrafted Ceramic Mug Set",
      title: "Handcrafted Ceramic Mug Set",
      price: 48.00,
      category: "Kitchen",
      category_name: "Kitchen",
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80", 
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Speckled White", "Terracotta", "Ocean Blue"],
      description: "Set of 4 handmade stoneware mugs, each uniquely crafted"
    },
    {
      id: 108,
      product_id: "108",
      name: "Lightweight Running Shoes",
      title: "Lightweight Running Shoes",
      price: 129.99,
      category: "Footwear",
      category_name: "Footwear",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Black/White", "Blue/Gray", "All Black"],
      description: "Ultra-lightweight running shoes with responsive cushioning"
    },
    {
      id: 109,
      product_id: "109",
      name: "Organic Cotton Throw Blanket",
      title: "Organic Cotton Throw Blanket",
      price: 89.99,
      category: "Home",
      category_name: "Home",
      image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Natural", "Slate Gray", "Dusty Pink"],
      description: "100% organic cotton throw blanket, ethically made"
    },
    {
      id: 110,
      product_id: "110",
      name: "Stainless Steel Water Bottle",
      title: "Stainless Steel Water Bottle",
      price: 34.99,
      category: "Accessories",
      category_name: "Accessories",
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Matte Black", "Brushed Steel", "Ocean Blue"],
      description: "Vacuum insulated bottle keeps drinks cold for 24 hours, hot for 12 hours"
    },
    {
      id: 111,
      product_id: "111",
      name: "Natural Bamboo Toothbrush Set",
      title: "Natural Bamboo Toothbrush Set",
      price: 18.99,
      category: "Personal Care",
      category_name: "Personal Care",
      image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Adult", "Child", "Family Pack"],
      description: "Pack of 4 biodegradable bamboo toothbrushes with charcoal-infused bristles"
    },
    {
      id: 112,
      product_id: "112",
      name: "Handwoven Market Basket",
      title: "Handwoven Market Basket",
      price: 45.00,
      category: "Home",
      category_name: "Home",
      image: "https://images.unsplash.com/photo-1631125915902-d9597523a363?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Natural", "Black Trim", "Colorful Pattern"],
      description: "Fair-trade handwoven basket, perfect for shopping or storage"
    }
  ];
  
  return mockProducts.map(product => standardizeProduct(product));
};

// Default mock products (simpler version)
export const generateMockShopifyProducts = (): Product[] => {
  const mockProducts = [
    {
      id: 101,
      product_id: "101",
      name: "Premium Bluetooth Headphones",
      title: "Premium Bluetooth Headphones",
      price: 129.99,
      category: "Electronics",
      category_name: "Electronics",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Black", "White", "Rose Gold"],
      description: "Noise-cancelling bluetooth headphones with 20-hour battery life"
    },
    {
      id: 102,
      product_id: "102",
      name: "Smart Fitness Watch",
      title: "Smart Fitness Watch",
      price: 199.99,
      category: "Electronics",
      category_name: "Electronics",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Black", "Silver", "Blue"],
      description: "Track your fitness goals with this premium smart watch"
    },
    {
      id: 103,
      product_id: "103",
      name: "Luxury Scented Candle Set",
      title: "Luxury Scented Candle Set",
      price: 49.99,
      category: "Home",
      category_name: "Home",
      image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Vanilla", "Lavender", "Sandalwood"],
      description: "Set of 4 premium hand-poured scented candles"
    },
    {
      id: 104,
      product_id: "104",
      name: "Ceramic Pour-Over Coffee Set",
      title: "Ceramic Pour-Over Coffee Set",
      price: 64.99,
      category: "Home",
      category_name: "Home",
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Matte Black", "White", "Terracotta"],
      description: "Complete pour-over coffee brewing kit with ceramic dripper"
    },
    {
      id: 105,
      product_id: "105",
      name: "Handcrafted Leather Wallet",
      title: "Handcrafted Leather Wallet",
      price: 79.99,
      category: "Accessories",
      category_name: "Accessories",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Brown", "Black", "Tan"],
      description: "Full-grain leather wallet with RFID protection"
    },
    {
      id: 106,
      product_id: "106",
      name: "Designer Succulent Planter",
      title: "Designer Succulent Planter",
      price: 34.99,
      category: "Home",
      category_name: "Home",
      image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80",
      vendor: "Shopify",
      retailer: "Shopify",
      variants: ["Small", "Medium", "Large"],
      description: "Geometric concrete planter perfect for succulents and small plants"
    },
  ];
  
  // Ensure vendor is set to "Shopify" for all products and standardize
  return mockProducts.map(product => standardizeProduct({
    ...product,
    vendor: "Shopify"
  }));
};

// Information for Shopify Partners without a store
export const getShopifyPartnerOptions = () => {
  return {
    developmentStore: {
      name: "Development Store",
      description: "Connect to a simulated development store for testing",
      url: "development"
    },
    partnerInfo: {
      description: "As a Shopify Partner, you can test the API using:",
      options: [
        "Use 'development' as the store URL to connect to a simulated store",
        "Create a free development store through the Shopify Partners program",
        "Use the Shopify CLI to create a development store for local testing"
      ]
    }
  };
};
