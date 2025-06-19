
/**
 * Category to specific product mapping for better search results
 * Maps broad categories to specific, giftable products
 */

export interface CategoryMapping {
  category: string;
  specificProducts: string[];
  searchTerms: string[];
}

/**
 * Enhanced category mappings that distinguish between Electronics and Tech
 */
export const CATEGORY_PRODUCT_MAPPINGS: CategoryMapping[] = [
  {
    category: "electronics",
    specificProducts: [
      "smart tv", "gaming console", "smart home", "audio system", 
      "bluetooth speaker", "camera", "home theater", "streaming device",
      "smart display", "soundbar", "gaming headset", "smart doorbell"
    ],
    searchTerms: ["smart tv", "gaming console", "smart home audio system", "camera bluetooth speaker"]
  },
  {
    category: "tech", 
    specificProducts: [
      "smartphone", "laptop", "tablet", "smartwatch", "computer",
      "headphones", "wireless earbuds", "power bank", "phone case",
      "laptop stand", "wireless charger", "keyboard", "mouse"
    ],
    searchTerms: ["smartphone", "laptop", "tablet", "smartwatch", "headphones wireless earbuds"]
  },
  {
    category: "gaming",
    specificProducts: [
      "video games", "gaming console", "gaming chair", "gaming headset",
      "gaming keyboard", "gaming mouse", "controller", "gaming monitor"
    ],
    searchTerms: ["video games", "gaming console", "gaming accessories", "controller"]
  },
  {
    category: "fashion",
    specificProducts: [
      "clothing", "shoes", "accessories", "jewelry", "bags",
      "watches", "sunglasses", "belts", "scarves", "handbags"
    ],
    searchTerms: ["clothing", "shoes", "fashion accessories", "jewelry bags"]
  },
  {
    category: "beauty-personal-care",
    specificProducts: [
      "skincare", "makeup", "perfume", "hair care", "beauty tools",
      "cosmetics", "face mask", "moisturizer", "lipstick", "nail polish"
    ],
    searchTerms: ["skincare", "makeup", "perfume", "beauty products cosmetics"]
  },
  {
    category: "home",
    specificProducts: [
      "home decor", "furniture", "bedding", "kitchen appliances",
      "storage solutions", "lighting", "rugs", "pillows", "candles"
    ],
    searchTerms: ["home decor", "furniture", "bedding", "kitchen appliances lighting"]
  },
  {
    category: "kitchen",
    specificProducts: [
      "kitchen appliances", "cookware", "utensils", "coffee maker",
      "blender", "air fryer", "instant pot", "knife set", "cutting board"
    ],
    searchTerms: ["kitchen appliances", "cookware", "coffee maker", "blender air fryer"]
  },
  {
    category: "toys",
    specificProducts: [
      "toys", "board games", "puzzles", "action figures", "dolls",
      "building blocks", "educational toys", "outdoor toys", "craft kits"
    ],
    searchTerms: ["toys", "board games", "puzzles", "action figures educational toys"]
  },
  {
    category: "sports",
    specificProducts: [
      "fitness equipment", "sports gear", "athletic wear", "outdoor equipment",
      "yoga mat", "dumbbells", "running shoes", "sports accessories"
    ],
    searchTerms: ["fitness equipment", "sports gear", "athletic wear", "outdoor equipment"]
  },
  {
    category: "books",
    specificProducts: [
      "books", "bestsellers", "fiction", "non-fiction", "children's books",
      "cookbooks", "self-help", "biography", "mystery", "romance"
    ],
    searchTerms: ["bestselling books", "popular books", "fiction non-fiction", "children's books"]
  }
];

/**
 * Get enhanced search terms for a category
 */
export const getEnhancedCategorySearch = (category: string, originalQuery: string): string => {
  const mapping = CATEGORY_PRODUCT_MAPPINGS.find(m => 
    m.category === category.toLowerCase() ||
    originalQuery.toLowerCase().includes(m.category)
  );
  
  if (mapping) {
    // Return the enhanced search terms while preserving "best selling" intent
    const enhancedTerms = mapping.searchTerms.join(" ");
    
    // If original query contains "best selling", preserve that intent
    if (originalQuery.toLowerCase().includes("best selling")) {
      return `best selling ${enhancedTerms}`;
    }
    
    return enhancedTerms;
  }
  
  return originalQuery;
};

/**
 * Detect if query is a broad category search that needs enhancement
 */
export const isBroadCategorySearch = (query: string): boolean => {
  const normalizedQuery = query.toLowerCase();
  
  return CATEGORY_PRODUCT_MAPPINGS.some(mapping => 
    normalizedQuery.includes(`best selling ${mapping.category}`) ||
    normalizedQuery.includes(`${mapping.category} gifts`) ||
    normalizedQuery === mapping.category
  );
};

/**
 * Extract category from search query
 */
export const extractCategoryFromQuery = (query: string): string | null => {
  const normalizedQuery = query.toLowerCase();
  
  for (const mapping of CATEGORY_PRODUCT_MAPPINGS) {
    if (normalizedQuery.includes(mapping.category)) {
      return mapping.category;
    }
  }
  
  return null;
};
