// ============================================================================
// CATEGORY REGISTRY - Single source of truth for all category configurations
// Must stay in sync with src/constants/categories.ts UNIVERSAL_CATEGORIES
// ============================================================================

export interface CategoryConfig {
  name: string;
  queries: string[];
  priceMax?: number;
  priceMin?: number;
}

export const CATEGORY_REGISTRY: Record<string, CategoryConfig> = {
  // === Primary frontend categories (from UNIVERSAL_CATEGORIES) ===
  'electronics': {
    name: 'Electronics & Gadgets',
    queries: [
      "best selling electronics apple samsung sony bose",
      "headphones earbuds airpods bose sony",
      "smart home devices alexa google nest",
      "tablets ipad android surface",
      "smart watches apple watch garmin fitbit"
    ]
  },
  'flowers': {
    name: 'Flowers & Arrangements',
    queries: [
      "fresh flowers bouquet delivery roses tulips",
      "sunflowers orchids wedding flowers",
      "sympathy arrangements seasonal blooms"
    ]
  },
  'fashion': {
    name: 'Fashion & Clothing',
    queries: [
      "best selling fashion clothing apparel",
      "shoes sneakers boots sandals",
      "accessories belts wallets scarves"
    ]
  },
  'pets': {
    name: 'Pet Supplies',
    queries: [
      "best selling pet products dog cat supplies",
      "pet toys treats grooming",
      "pet beds leashes collars"
    ]
  },
  'home': {
    name: 'Home & Living',
    queries: [
      "home decor furniture living room",
      "kitchen accessories bedding curtains",
      "pillows candles home fragrance",
      "throw blankets rugs wall art"
    ]
  },
  'beauty': {
    name: 'Beauty & Personal Care',
    queries: [
      "skincare makeup cosmetics beauty products",
      "lipstick foundation moisturizer serum",
      "hair care styling tools perfume"
    ]
  },
  'sports': {
    name: 'Sports & Outdoors',
    queries: [
      "best selling sports equipment fitness",
      "nike adidas under armour workout gear",
      "outdoor camping hiking gear",
      "yoga fitness accessories"
    ]
  },
  'athleisure': {
    name: 'Athleisure & Activewear',
    queries: [
      "athletic wear yoga pants leggings",
      "activewear shorts sports bras",
      "workout tops athletic clothing"
    ]
  },
  'books': {
    name: 'Books & Media',
    queries: [
      "best selling books fiction nonfiction",
      "bestsellers new releases novels",
      "self help books educational"
    ]
  },
  'toys': {
    name: 'Toys & Games',
    queries: [
      "toys games kids children educational",
      "puzzles building blocks lego",
      "dolls action figures board games"
    ]
  },
  'arts': {
    name: 'Arts & Crafts',
    queries: [
      "art supplies craft supplies drawing",
      "paint brushes canvas markers",
      "craft kits scrapbook supplies"
    ]
  },
  'health': {
    name: 'Health & Wellness',
    queries: [
      "health wellness vitamins supplements",
      "essential oils aromatherapy diffuser",
      "first aid personal care hygiene"
    ]
  },
  'baby': {
    name: 'Baby Products',
    queries: [
      "best selling baby products essentials",
      "baby toys stroller car seat",
      "baby clothing diapers feeding"
    ]
  },
  'jewelry': {
    name: 'Jewelry',
    queries: [
      "best selling jewelry necklaces bracelets",
      "earrings rings fine jewelry",
      "fashion jewelry watches accessories"
    ]
  },
  'kitchen': {
    name: 'Kitchen Essentials',
    queries: [
      "best selling kitchen products cookware",
      "kitchen gadgets utensils appliances",
      "bakeware food storage organization"
    ]
  },
  'tech': {
    name: 'Tech & Gadgets',
    queries: [
      "best selling tech products gadgets",
      "smart devices phone accessories",
      "chargers cables adapters"
    ]
  },
  'music': {
    name: 'Music & Audio',
    queries: [
      "musical instruments guitar piano keyboard",
      "music accessories strings picks",
      "audio equipment speakers microphones"
    ]
  },
  'gaming': {
    name: 'Gaming',
    queries: [
      "best selling gaming accessories",
      "video games playstation xbox nintendo",
      "gaming headset keyboard mouse controller"
    ]
  },
  'wedding': {
    name: 'Wedding',
    queries: [
      "wedding gifts bridal party engagement",
      "wedding decorations favors invitations",
      "reception ceremony supplies"
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
      "popular trending items"
    ]
  },
  'gifts': {
    name: 'Gift Ideas',
    queries: [
      "best selling gifts gift ideas",
      "unique gifts birthday presents",
      "gift sets holiday gifts"
    ]
  },
  'bags-purses': {
    name: 'Bags & Purses',
    queries: [
      "best selling bags purses handbags",
      "backpacks tote bags crossbody",
      "travel bags luggage wallets"
    ]
  },

  // === Legacy/special categories ===
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
      "yoga and fitness accessories"
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
      "skincare sets under 50"
    ],
    priceMax: 50,
    priceMin: 1
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
