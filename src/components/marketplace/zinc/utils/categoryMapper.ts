
// Utility function to map search terms to image categories

// Define a simple mapping object instead of using require
const categoryMapping: Record<string, string> = {
  // Electronics
  "iphone": "electronics",
  "airpods": "electronics",
  "macbook": "electronics",
  "laptop": "electronics",
  "headphones": "electronics",
  "tablet": "electronics",
  "ipad": "electronics",
  "kindle": "electronics",
  "camera": "electronics",
  "alexa": "electronics",
  "echo": "electronics",
  "playstation": "electronics",
  "xbox": "electronics",
  "nintendo": "electronics",
  "gaming": "electronics",
  "tv": "electronics",
  "computer": "electronics",
  "monitor": "electronics",
  
  // Clothing
  "shirt": "clothing",
  "dress": "clothing",
  "pants": "clothing",
  "shoes": "clothing",
  "nike": "clothing",
  "adidas": "clothing",
  "puma": "clothing",
  "jacket": "clothing",
  "hat": "clothing",
  "cap": "clothing",
  "socks": "clothing",
  "padres": "clothing",  // Specifically add padres to clothing
  "cowboys": "clothing", // Sports teams generally map to clothing
  
  // Home
  "furniture": "home",
  "chair": "home",
  "table": "home",
  "desk": "home",
  "sofa": "home",
  "kitchenware": "home",
  "cookware": "home",
  "bedding": "home",
  "pillow": "home",
  "mattress": "home",
  "decor": "home",
  
  // Fitness
  "yoga": "fitness",
  "exercise": "fitness",
  "fitness": "fitness",
  "weights": "fitness",
  "treadmill": "fitness",
  "gym": "fitness",
  
  // Beauty
  "makeup": "beauty",
  "skincare": "beauty",
  "haircare": "beauty",
  "perfume": "beauty",
  "cosmetics": "beauty",
  
  // Kids
  "toys": "kids",
  "baby": "kids",
  "kids": "kids",
  "children": "kids",
  
  // Generic fallbacks by brand
  "amazon": "electronics",
  "apple": "electronics",
  "samsung": "electronics",
  "google": "electronics",
  "microsoft": "electronics",
  "sony": "electronics",
  "lg": "electronics",
  "bose": "electronics",
  "dell": "electronics",
  "hp": "electronics",
  "asus": "electronics",
  "lenovo": "electronics"
};

/**
 * Get the most appropriate image category for a search query
 */
export const getImageCategory = (query: string): string => {
  const lowercaseQuery = query.toLowerCase();
  
  // Special case handlers
  if (lowercaseQuery.includes("macbook") || lowercaseQuery.includes("mac book")) {
    return "electronics";
  }
  
  if (lowercaseQuery.includes("padres") && (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
    return "clothing";
  }
  
  // Check for specific keyword matches
  for (const [keyword, category] of Object.entries(categoryMapping)) {
    if (lowercaseQuery.includes(keyword)) {
      return category;
    }
  }
  
  // If no specific mapping found, determine based on common patterns
  if (
    lowercaseQuery.includes("phone") || 
    lowercaseQuery.includes("tech") || 
    lowercaseQuery.includes("gadget")
  ) {
    return "electronics";
  }
  
  if (
    lowercaseQuery.includes("wear") || 
    lowercaseQuery.includes("fashion") ||
    lowercaseQuery.includes("apparel") ||
    lowercaseQuery.includes("hat") ||
    lowercaseQuery.includes("cap")
  ) {
    return "clothing";
  }
  
  // Default fallback
  return "electronics";
};
