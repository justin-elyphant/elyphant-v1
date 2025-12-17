// ============================================================================
// CATEGORY REGISTRY - Single source of truth for all category configurations
// ============================================================================

export interface CategoryConfig {
  name: string;
  queries: string[];
  priceMax?: number;
  priceMin?: number;
}

export const CATEGORY_REGISTRY: Record<string, CategoryConfig> = {
  'luxury': {
    name: 'Luxury Items',
    queries: [
      "top designer bags for women",
      "top designer sunglasses", 
      "luxury watches",
      "designer jewelry"
    ]
  },
  'gifts-for-her': {
    name: 'Gifts for Her',
    queries: [
      "skincare essentials for women",
      "cozy sweaters and cardigans", 
      "candles and home fragrance",
      "books and reading accessories",
      "yoga and fitness accessories",
      "coffee and tea gifts"
    ]
  },
  'gifts-for-him': {
    name: 'Gifts for Him',
    queries: [
      "tech gadgets for men",
      "grooming essentials",
      "fitness and sports gear",
      "watches and accessories", 
      "tools and gadgets",
      "gaming accessories"
    ]
  },
  'gifts-under-50': {
    name: 'Gifts Under $50',
    queries: [
      "best gifts under 50",
      "popular products under 50",
      "bluetooth earbuds under 50",
      "phone accessories under 50", 
      "kitchen gadgets under 50",
      "skincare sets under 50",
      "jewelry gifts under 50",
      "home decor items under 50",
      "tech accessories under 50",
      "books under 50",
      "coffee accessories under 50",
      "fitness accessories under 50"
    ],
    priceMax: 50,
    priceMin: 1
  },
  'electronics': {
    name: 'Electronics & Gadgets',
    queries: [
      "smartphones phones mobile devices apple samsung",
      "laptops computers macbook dell hp",
      "headphones earbuds airpods bose sony",
      "smart home devices alexa google nest",
      "gaming consoles playstation xbox nintendo",
      "cameras photography canon nikon sony",
      "tablets ipad android surface",
      "smart watches apple watch garmin fitbit"
    ]
  },
  'best-selling': {
    name: 'Best Sellers',
    queries: [
      "best selling electronics gadgets",
      "best selling home kitchen essentials", 
      "best selling fashion clothing",
      "best selling books bestsellers",
      "best selling beauty products",
      "best selling fitness equipment",
      "best selling toys games",
      "popular trending items"
    ]
  }
};

// Legacy flag to category mapping (backward compatibility during migration)
export const LEGACY_FLAG_TO_CATEGORY: Record<string, string> = {
  'luxuryCategories': 'luxury',
  'giftsForHer': 'gifts-for-her',
  'giftsForHim': 'gifts-for-him',
  'giftsUnder50': 'gifts-under-50',
  'electronics': 'electronics',
  'bestSelling': 'best-selling'
};

// Brand category mappings for multi-category brand searches
export const BRAND_CATEGORY_MAPPINGS: Record<string, string[]> = {
  apple: [
    "apple macbook laptop computers",
    "apple iphone smartphones",
    "apple ipad tablets", 
    "apple watch smartwatch",
    "apple airpods earbuds headphones",
    "apple mac desktop computers"
  ],
  nike: [
    "nike running shoes",
    "nike athletic clothing apparel",
    "nike basketball shoes",
    "nike workout gear",
    "nike sports accessories"
  ],
  samsung: [
    "samsung galaxy phones",
    "samsung tablets",
    "samsung smartwatch",
    "samsung earbuds",
    "samsung laptops",
    "samsung televisions TVs"
  ],
  sony: [
    "sony headphones",
    "sony cameras", 
    "sony playstation gaming",
    "sony speakers",
    "sony televisions TVs",
    "sony electronics"
  ],
  adidas: [
    "adidas running shoes",
    "adidas athletic clothing",
    "adidas soccer cleats",
    "adidas workout gear",
    "adidas sports accessories"
  ],
  athleisure: [
    "yoga pants leggings",
    "athletic workout tops",
    "sports bras women",
    "activewear shorts",
    "yoga accessories",
    "athletic clothing",
    "workout gear",
    "athleisure wear"
  ],
  madein: [
    "made in cookware pots pans",
    "made in kitchen knives",
    "made in bakeware",
    "made in kitchen accessories",
    "made in carbon steel pans"
  ],
  lego: [
    "lego building sets",
    "lego architecture",
    "lego creator sets",
    "lego technic",
    "lego minifigures"
  ]
};
