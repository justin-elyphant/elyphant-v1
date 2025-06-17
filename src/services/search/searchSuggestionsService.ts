
// Search suggestions service for text-based autocomplete
// This provides fast, client-side suggestions without API calls

export interface SearchSuggestion {
  text: string;
  type: 'completion' | 'popular' | 'category' | 'brand';
}

// Popular search terms based on common e-commerce patterns
const POPULAR_SEARCHES = [
  'iPhone 15', 'iPad Pro', 'MacBook Air', 'AirPods', 'Apple Watch',
  'Nike shoes', 'Adidas sneakers', 'running shoes', 'basketball shoes',
  'Dallas Cowboys jersey', 'Dallas Cowboys hat', 'NFL merchandise',
  'kitchen appliances', 'coffee maker', 'air fryer', 'blender',
  'gaming headset', 'wireless headphones', 'bluetooth speaker',
  'laptop bag', 'phone case', 'screen protector', 'charger',
  'winter jacket', 'hoodie', 'jeans', 't-shirt', 'dress',
  'birthday gift', 'anniversary gift', 'graduation gift'
];

// Product categories
const CATEGORIES = [
  'Electronics', 'Clothing', 'Footwear', 'Home & Kitchen', 'Sports',
  'Beauty', 'Books', 'Toys', 'Automotive', 'Health', 'Jewelry',
  'Pet Supplies', 'Office Supplies', 'Tools', 'Outdoor'
];

// Popular brands
const BRANDS = [
  'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Amazon', 'Google',
  'Microsoft', 'Dell', 'HP', 'Canon', 'Nikon', 'Bose', 'JBL',
  'Under Armour', 'Levi\'s', 'Calvin Klein', 'Ralph Lauren',
  'KitchenAid', 'Cuisinart', 'Dyson', 'Roomba'
];

// Generate search completions based on query
const generateCompletions = (query: string): string[] => {
  if (query.length < 2) return [];
  
  const queryLower = query.toLowerCase();
  const completions: string[] = [];
  
  // Common completion patterns
  const completionPatterns: Record<string, string[]> = {
    'iphone': ['iPhone 15', 'iPhone 15 Pro', 'iPhone 14', 'iPhone case', 'iPhone charger'],
    'ipad': ['iPad Pro', 'iPad Air', 'iPad Mini', 'iPad case', 'iPad keyboard'],
    'macbook': ['MacBook Pro', 'MacBook Air', 'MacBook case', 'MacBook charger'],
    'nike': ['Nike shoes', 'Nike sneakers', 'Nike running shoes', 'Nike basketball shoes'],
    'adidas': ['Adidas shoes', 'Adidas sneakers', 'Adidas running shoes', 'Adidas originals'],
    'dallas': ['Dallas Cowboys', 'Dallas Cowboys jersey', 'Dallas Cowboys hat', 'Dallas Cowboys merchandise'],
    'cowboys': ['Dallas Cowboys', 'Dallas Cowboys jersey', 'Dallas Cowboys hat', 'Dallas Cowboys shirt'],
    'kitchen': ['kitchen appliances', 'kitchen utensils', 'kitchen gadgets', 'kitchen storage'],
    'coffee': ['coffee maker', 'coffee grinder', 'coffee beans', 'coffee mug'],
    'headphones': ['wireless headphones', 'bluetooth headphones', 'gaming headphones', 'noise canceling headphones']
  };
  
  // Find exact matches first
  for (const [key, patterns] of Object.entries(completionPatterns)) {
    if (queryLower.includes(key)) {
      completions.push(...patterns.filter(p => 
        p.toLowerCase().includes(queryLower) && p.toLowerCase() !== queryLower
      ));
    }
  }
  
  // Add partial matches from popular searches
  const partialMatches = POPULAR_SEARCHES.filter(search => 
    search.toLowerCase().includes(queryLower) && 
    search.toLowerCase() !== queryLower &&
    !completions.includes(search)
  );
  
  completions.push(...partialMatches);
  
  return completions.slice(0, 5); // Limit to 5 completions
};

export const getSearchSuggestions = (query: string): SearchSuggestion[] => {
  if (!query || query.length < 1) {
    // Show popular searches when no query
    return POPULAR_SEARCHES.slice(0, 8).map(text => ({
      text,
      type: 'popular' as const
    }));
  }
  
  const suggestions: SearchSuggestion[] = [];
  const queryLower = query.toLowerCase();
  
  // 1. Search completions (highest priority)
  const completions = generateCompletions(query);
  suggestions.push(...completions.map(text => ({
    text,
    type: 'completion' as const
  })));
  
  // 2. Matching brands
  const matchingBrands = BRANDS.filter(brand => 
    brand.toLowerCase().includes(queryLower) && 
    brand.toLowerCase() !== queryLower
  ).slice(0, 3);
  
  suggestions.push(...matchingBrands.map(text => ({
    text,
    type: 'brand' as const
  })));
  
  // 3. Matching categories
  const matchingCategories = CATEGORIES.filter(category => 
    category.toLowerCase().includes(queryLower) && 
    category.toLowerCase() !== queryLower
  ).slice(0, 2);
  
  suggestions.push(...matchingCategories.map(text => ({
    text,
    type: 'category' as const
  })));
  
  // 4. Popular searches that match (if we need more)
  if (suggestions.length < 8) {
    const remainingPopular = POPULAR_SEARCHES.filter(search => 
      search.toLowerCase().includes(queryLower) && 
      search.toLowerCase() !== queryLower &&
      !suggestions.some(s => s.text === search)
    ).slice(0, 8 - suggestions.length);
    
    suggestions.push(...remainingPopular.map(text => ({
      text,
      type: 'popular' as const
    })));
  }
  
  return suggestions.slice(0, 8); // Limit to 8 total suggestions
};
