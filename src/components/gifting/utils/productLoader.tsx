import { Product } from "@/types/product";

/**
 * Load products saved in localStorage
 */
export const loadSavedProducts = (): Product[] => {
  try {
    const savedProducts = localStorage.getItem("gifting-products");
    if (savedProducts) {
      return JSON.parse(savedProducts);
    }
  } catch (e) {
    console.error("Failed to load products from localStorage:", e);
  }
  
  return [];
};

/**
 * Save products to localStorage
 */
export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem("gifting-products", JSON.stringify(products));
  } catch (e) {
    console.error("Failed to save products to localStorage:", e);
  }
};

/**
 * Load mock products for demonstration
 */
export const loadMockProducts = (): Product[] => {
  // Create a set of mock products for testing
  const mockProducts: Product[] = [
    {
      id: "1001",  // Changed from number to string
      name: "Premium Wireless Headphones",
      price: 149.99,
      category: "Electronics",
      image: "https://placehold.co/300x300/e6f2ff/007bff?text=Headphones",
      vendor: "SoundTech",
      variants: ["Black", "Silver", "White"],
      description: "Experience crystal clear audio with these premium wireless headphones featuring active noise cancellation and long battery life.",
      rating: 4.8,
      reviewCount: 248,
    },
    {
      id: "1002",
      name: "Leather Messenger Bag",
      price: 89.99,
      category: "Fashion",
      image: "https://placehold.co/300x300/fff5e6/cc7000?text=Bag",
      vendor: "Urban Style",
      description: "A stylish genuine leather messenger bag with multiple compartments, perfect for work or casual outings.",
      rating: 4.5,
      reviewCount: 187,
    },
    {
      id: "1003",
      name: "Smart Fitness Tracker",
      price: 79.99,
      category: "Fitness",
      image: "https://placehold.co/300x300/e6ffe6/00cc00?text=Tracker",
      vendor: "FitLife",
      description: "Track your activity levels, heart rate, and sleep patterns with this advanced fitness tracker.",
      rating: 4.6,
      reviewCount: 212,
    },
    {
      id: "1004",
      name: "Gourmet Coffee Sampler",
      price: 24.99,
      category: "Food & Beverage",
      image: "https://placehold.co/300x300/ffe6e6/cc0000?text=Coffee",
      vendor: "Coffee Delights",
      description: "A curated selection of gourmet coffees from around the world, perfect for coffee enthusiasts.",
      rating: 4.7,
      reviewCount: 195,
    },
    {
      id: "1005",
      name: "Cozy Knit Blanket",
      price: 49.99,
      category: "Home Goods",
      image: "https://placehold.co/300x300/e6e6ff/6666ff?text=Blanket",
      vendor: "Comfort Zone",
      description: "Wrap yourself in warmth with this soft and cozy knit blanket, ideal for relaxing at home.",
      rating: 4.9,
      reviewCount: 276,
    }
  ];
  
  return mockProducts;
};
