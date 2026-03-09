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
    
    // Detect if this is a development store request (check BEFORE URL validation)
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
    
    // For demo purposes, check if the URL looks valid
    if (!storeUrl.includes('.myshopify.com') && !storeUrl.endsWith('.com') && !storeUrl.endsWith('.store')) {
      return { 
        success: false, 
        message: "Please enter a valid Shopify store URL (e.g., yourstore.myshopify.com)"
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
      product_id: "shopify-1001",
      name: "Classic Minimalist Watch",
      title: "Classic Minimalist Watch",
      price: 199.99,
      original_retail_price: 249.99,
      category: "Watches & Accessories",
      category_name: "Watches & Accessories",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600",
        "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600"
      ],
      vendor: "Dev Store",
      retailer: "Dev Store",
      brand: "Timecraft",
      description: "Elegant minimalist watch with Japanese quartz movement, genuine leather strap, and scratch-resistant sapphire crystal. Water resistant to 50m.",
      feature_bullets: [
        "Japanese quartz movement for precision timekeeping",
        "Genuine Italian leather strap with quick-release pins",
        "Scratch-resistant sapphire crystal face",
        "Water resistant to 50 meters"
      ],
      tags: ["gift", "bestseller", "accessories", "watches"],
      stars: 4.7,
      review_count: 2340,
      productSource: 'shopify' as const,
      variant_specifics: [{ dimension: "Color", value: "Silver" }],
      all_variants: [
        { variant_specifics: [{ dimension: "Color", value: "Silver" }], product_id: "shopify-1001-silver" },
        { variant_specifics: [{ dimension: "Color", value: "Gold" }], product_id: "shopify-1001-gold" },
        { variant_specifics: [{ dimension: "Color", value: "Rose Gold" }], product_id: "shopify-1001-rosegold" }
      ]
    },
    {
      id: 1002,
      product_id: "shopify-1002",
      name: "Wireless Noise-Cancelling Headphones",
      title: "Wireless Noise-Cancelling Headphones",
      price: 149.99,
      category: "Electronics",
      category_name: "Electronics",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600"
      ],
      vendor: "Dev Store",
      retailer: "Dev Store",
      brand: "SoundWave",
      description: "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and memory foam ear cushions for all-day comfort.",
      feature_bullets: [
        "Active noise cancellation with transparency mode",
        "30-hour battery life with quick charge (10 min = 3 hrs)",
        "Memory foam ear cushions with cooling gel",
        "Bluetooth 5.3 with multipoint connection"
      ],
      tags: ["electronics", "audio", "gift", "top-rated"],
      stars: 4.5,
      review_count: 8920,
      productSource: 'shopify' as const,
      variant_specifics: [{ dimension: "Color", value: "Matte Black" }],
      all_variants: [
        { variant_specifics: [{ dimension: "Color", value: "Matte Black" }], product_id: "shopify-1002-black" },
        { variant_specifics: [{ dimension: "Color", value: "Silver" }], product_id: "shopify-1002-silver" },
        { variant_specifics: [{ dimension: "Color", value: "Navy" }], product_id: "shopify-1002-navy" }
      ]
    },
    {
      id: 1003,
      product_id: "shopify-1003",
      name: "Vintage Instant Camera",
      title: "Vintage Instant Camera",
      price: 89.99,
      category: "Photography",
      category_name: "Photography",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600",
      images: [
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600",
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600"
      ],
      vendor: "Dev Store",
      retailer: "Dev Store",
      brand: "SnapRetro",
      description: "Retro-style instant camera with built-in flash, automatic exposure control, and self-timer. Uses standard mini film packs.",
      feature_bullets: [
        "Built-in flash with automatic intensity adjustment",
        "Automatic exposure control for perfect shots every time",
        "Self-timer with 10-second delay",
        "Compatible with standard Instax Mini film"
      ],
      tags: ["photography", "gift", "retro", "creative"],
      stars: 4.3,
      review_count: 1560,
      productSource: 'shopify' as const,
      variant_specifics: [{ dimension: "Color", value: "Mint Green" }],
      all_variants: [
        { variant_specifics: [{ dimension: "Color", value: "Mint Green" }], product_id: "shopify-1003-mint" },
        { variant_specifics: [{ dimension: "Color", value: "Coral" }], product_id: "shopify-1003-coral" },
        { variant_specifics: [{ dimension: "Color", value: "Classic Black" }], product_id: "shopify-1003-black" }
      ]
    },
    {
      id: 1004,
      product_id: "shopify-1004",
      name: "Polarized Sport Sunglasses",
      title: "Polarized Sport Sunglasses",
      price: 79.99,
      original_retail_price: 99.99,
      category: "Eyewear",
      category_name: "Eyewear",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600",
      images: [
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600",
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600"
      ],
      vendor: "Dev Store",
      retailer: "Dev Store",
      brand: "OpticShield",
      description: "Lightweight polarized sunglasses with UV400 protection, anti-scratch coating, and flexible TR90 frame for active lifestyles.",
      feature_bullets: [
        "Polarized TAC lenses with UV400 protection",
        "Anti-scratch and anti-reflective coating",
        "Flexible TR90 frame — lightweight and durable",
        "Includes hard case and microfiber cloth"
      ],
      tags: ["eyewear", "sport", "outdoor", "gift"],
      stars: 4.6,
      review_count: 3210,
      productSource: 'shopify' as const,
      variant_specifics: [{ dimension: "Style", value: "Tortoise" }],
      all_variants: [
        { variant_specifics: [{ dimension: "Style", value: "Tortoise" }], product_id: "shopify-1004-tortoise" },
        { variant_specifics: [{ dimension: "Style", value: "Black" }], product_id: "shopify-1004-black" },
        { variant_specifics: [{ dimension: "Style", value: "Clear" }], product_id: "shopify-1004-clear" }
      ]
    },
    {
      id: 1005,
      product_id: "shopify-1005",
      name: "Premium Running Shoes",
      title: "Premium Running Shoes",
      price: 129.99,
      category: "Footwear",
      category_name: "Footwear",
      image: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600",
      images: [
        "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600"
      ],
      vendor: "Dev Store",
      retailer: "Dev Store",
      brand: "StrideMax",
      description: "Breathable mesh running shoes with responsive EVA cushioning, reinforced arch support, and durable rubber outsole for road and trail.",
      feature_bullets: [
        "Breathable engineered mesh upper",
        "Responsive EVA midsole with energy return",
        "Reinforced arch support for stability",
        "Durable rubber outsole with multi-surface grip"
      ],
      tags: ["footwear", "running", "sport", "gift"],
      stars: 4.4,
      review_count: 5670,
      productSource: 'shopify' as const,
      variant_specifics: [{ dimension: "Size", value: "US 9" }],
      all_variants: [
        { variant_specifics: [{ dimension: "Size", value: "US 8" }], product_id: "shopify-1005-us8" },
        { variant_specifics: [{ dimension: "Size", value: "US 9" }], product_id: "shopify-1005-us9" },
        { variant_specifics: [{ dimension: "Size", value: "US 10" }], product_id: "shopify-1005-us10" },
        { variant_specifics: [{ dimension: "Size", value: "US 11" }], product_id: "shopify-1005-us11" }
      ]
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
