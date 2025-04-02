
import { Product } from "@/contexts/ProductContext";

export const loadMockProducts = (): Product[] => {
  console.log("Loading mock products data");
  const mockProducts = [
    {
      id: 1,
      name: "Wireless Headphones",
      price: 129.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
      vendor: "AudioTech",
      variants: ["Black", "White", "Blue"],
      description: "Premium wireless headphones with noise cancellation"
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 249.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
      vendor: "TechWear",
      variants: ["Black", "Silver"],
      description: "Smart watch with health tracking features"
    },
    {
      id: 3,
      name: "Scented Candle Set",
      price: 39.99,
      category: "Home",
      image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
      vendor: "HomeScents",
      variants: ["Vanilla", "Lavender", "Ocean"],
      description: "Set of 3 premium scented candles"
    },
    {
      id: 4,
      name: "Coffee Mug",
      price: 19.99,
      category: "Home",
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80",
      vendor: "KitchenGoods",
      variants: ["Black", "White", "Blue"],
      description: "Ceramic coffee mug with unique design"
    },
    {
      id: 5,
      name: "Designer Wallet",
      price: 89.99,
      category: "Accessories",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80",
      vendor: "FashionHub",
      variants: ["Brown", "Black"],
      description: "Premium leather wallet with multiple card slots"
    },
    {
      id: 6,
      name: "Plant Pot",
      price: 24.99,
      category: "Home",
      image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80",
      vendor: "GreenThumb",
      variants: ["Small", "Medium", "Large"],
      description: "Ceramic plant pot with drainage hole"
    },
    {
      id: 7,
      name: "Leather Notebook",
      price: 34.99,
      category: "Stationery",
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80",
      vendor: "PaperWorks",
      description: "Premium leather-bound notebook with 200 pages"
    },
    {
      id: 8,
      name: "Essential Oil Diffuser",
      price: 49.99,
      category: "Home",
      image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&q=80",
      vendor: "WellnessHub",
      description: "Ultrasonic essential oil diffuser with LED lights"
    },
  ];
  console.log(`Returning ${mockProducts.length} mock products`);
  return mockProducts;
};

export const loadSavedProducts = (): Product[] | null => {
  console.log("Attempting to load saved products from localStorage");
  const savedProducts = localStorage.getItem('shopifyProducts');
  if (savedProducts) {
    try {
      const parsed = JSON.parse(savedProducts);
      console.log(`Found ${parsed.length} saved products in localStorage`);
      return parsed;
    } catch (e) {
      console.error("Error parsing saved products:", e);
      return null;
    }
  }
  console.log("No saved products found in localStorage");
  return null;
};
