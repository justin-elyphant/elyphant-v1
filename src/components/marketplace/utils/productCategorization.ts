
import { Product } from "@/types/product";

export interface CategoryConfig {
  title: string;
  subtitle: string;
  keywords: string[];
  excludeKeywords: string[];
}

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  electronics: {
    title: "Best Selling Electronics",
    subtitle: "Top-rated phones, computers, and gadgets",
    keywords: ["phone", "iphone", "samsung", "computer", "laptop", "tablet", "ipad", "headphones", "earbuds", "camera", "tv", "monitor", "speaker", "electronics", "apple", "gaming", "console", "playstation", "xbox", "nintendo"],
    excludeKeywords: []
  },
  homeKitchen: {
    title: "Best Selling Home & Kitchen",
    subtitle: "Essential appliances and home essentials",
    keywords: ["kitchen", "home", "appliance", "cookware", "furniture", "decor", "cleaning", "storage", "dining", "bedroom", "living", "bathroom", "tool", "vacuum", "coffee", "blender", "microwave", "oven", "refrigerator"],
    excludeKeywords: []
  },
  tech: {
    title: "Best Selling Tech",
    subtitle: "Smart devices and innovative technology",
    keywords: ["smart home", "iot", "automation", "robotics", "sensor", "processor", "microcontroller", "circuit", "arduino", "raspberry pi", "drone", "3d printer", "vr", "ar", "virtual reality", "augmented reality", "ai", "machine learning"],
    excludeKeywords: ["beauty", "skincare", "makeup", "cosmetic", "lotion", "cream", "perfume", "fragrance", "hair", "shampoo", "kitchen", "cookware", "furniture", "clothing", "fashion", "jewelry", "craft", "art", "hand", "casting"]
  },
  beauty: {
    title: "Best Selling Beauty",
    subtitle: "Popular skincare, makeup, and personal care",
    keywords: ["beauty", "skincare", "makeup", "cosmetic", "lotion", "cream", "perfume", "fragrance", "hair", "shampoo", "conditioner", "personal care", "health", "wellness", "serum", "moisturizer", "cleanser", "toner", "mask", "sunscreen"],
    excludeKeywords: []
  }
};

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

  // Define priority order (more specific categories first)
  const categoryOrder = ['beauty', 'electronics', 'homeKitchen', 'tech'];

  // Check each category in priority order
  for (const categoryKey of categoryOrder) {
    const config = CATEGORY_CONFIGS[categoryKey];
    
    // Check if product should be excluded from this category
    const hasExcludeKeyword = config.excludeKeywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    
    if (hasExcludeKeyword) continue;
    
    // Check if product matches this category
    const hasIncludeKeyword = config.keywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    
    if (hasIncludeKeyword) {
      categories.push(categoryKey);
      // Only assign to the first matching category to avoid overlap
      break;
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
