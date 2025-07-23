
import { Product } from "@/types/product";

export interface CategoryConfig {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

export const CATEGORY_CONFIGS = {
  electronics: {
    title: "Best Selling Electronics",
    subtitle: "Top-rated phones, computers, and gadgets",
    keywords: ["phone", "iphone", "samsung", "computer", "laptop", "tablet", "ipad", "headphones", "earbuds", "camera", "tv", "monitor", "speaker", "electronics", "tech", "apple", "gaming"]
  },
  homeKitchen: {
    title: "Best Selling Home & Kitchen",
    subtitle: "Essential appliances and home essentials",
    keywords: ["kitchen", "home", "appliance", "cookware", "furniture", "decor", "cleaning", "storage", "dining", "bedroom", "living", "bathroom", "tool", "vacuum", "coffee", "blender"]
  },
  tech: {
    title: "Best Selling Tech",
    subtitle: "Smart devices and innovative technology",
    keywords: ["smart", "wireless", "bluetooth", "charger", "cable", "accessory", "gadget", "device", "tech", "electronic", "digital", "usb", "power", "battery", "case", "stand"]
  },
  beauty: {
    title: "Best Selling Beauty",
    subtitle: "Popular skincare, makeup, and personal care",
    keywords: ["beauty", "skincare", "makeup", "cosmetic", "lotion", "cream", "perfume", "fragrance", "hair", "shampoo", "conditioner", "personal care", "health", "wellness"]
  }
} as const;

/**
 * Categorize a product based on its properties
 */
export const categorizeProduct = (product: Product): string[] => {
  const searchText = [
    product.title || "",
    product.name || "",
    product.category || "",
    product.description || "",
    product.brand || "",
    ...(product.tags || [])
  ].join(" ").toLowerCase();

  const categories: string[] = [];

  // Check each category
  for (const [categoryKey, config] of Object.entries(CATEGORY_CONFIGS)) {
    if (config.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
      categories.push(categoryKey);
    }
  }

  return categories;
};

/**
 * Filter products by category and best seller status
 */
export const filterProductsByCategory = (products: Product[], categoryKey: string): Product[] => {
  return products.filter(product => {
    // Must be a best seller
    if (!product.isBestSeller) return false;
    
    // Must match the category
    const productCategories = categorizeProduct(product);
    return productCategories.includes(categoryKey);
  });
};

/**
 * Get general best selling products (not category-specific)
 */
export const getGeneralBestSellers = (products: Product[]): Product[] => {
  return products.filter(product => product.isBestSeller);
};
