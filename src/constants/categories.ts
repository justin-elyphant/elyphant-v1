
import { 
  Smartphone, 
  Shirt, 
  Home, 
  Heart, 
  Dumbbell, 
  BookOpen, 
  Gamepad2, 
   
  Palette, 
  Pill, 
  Flower,
  Baby,
  Sparkles,
  Gift,
  ShoppingBag,
  Music,
  Monitor,
  Utensils,
  PartyPopper,
  Gem,
  PawPrint
} from "lucide-react";

export interface Category {
  id: number;
  name: string;
  value: string;
  searchTerm: string;
  icon?: any;
  description?: string;
  displayName?: string;
}

export const UNIVERSAL_CATEGORIES: Category[] = [
  {
    id: 1,
    name: "Electronics",
    value: "electronics",
    searchTerm: "best selling electronics apple samsung sony bose lg hp dell canon nikon fitbit garmin", // Enhanced for brand diversity
    icon: Smartphone,
    description: "Latest tech and gadgets",
    displayName: "Electronics & Accessories"
  },
  {
    id: 2,
    name: "Flowers",
    value: "flowers",
    searchTerm: "fresh flowers bouquet delivery roses tulips sunflowers orchids wedding flowers sympathy arrangements seasonal blooms", // Enhanced for variety
    icon: Flower,
    description: "Fresh flowers and arrangements"
  },
  {
    id: 3,
    name: "Fashion",
    value: "fashion",
    searchTerm: "best selling fashion clothing apparel shoes accessories", // Enhanced for brand diversity
    icon: Shirt,
    description: "Clothing and accessories"
  },
  {
    id: 4,
    name: "Pets",
    value: "pets",
    searchTerm: "best selling pet products dog cat supplies toys treats", // Enhanced with multiple terms
    icon: PawPrint,
    description: "Pet supplies and accessories"
  },
  {
    id: 5,
    name: "Home & Living",
    value: "home",
    searchTerm: "home decor furniture kitchen accessories bedding curtains pillows candles", // Optimized for home products
    icon: Home,
    description: "Decor and household items",
    displayName: "Home & Garden"
  },
  {
    id: 6,
    name: "Beauty",
    value: "beauty",
    searchTerm: "skincare makeup cosmetics beauty products lipstick foundation moisturizer", // Optimized for specific beauty products
    icon: Heart,
    description: "Skincare and cosmetics",
    displayName: "Beauty & Personal Care"
  },
  {
    id: 7,
    name: "Sports",
    value: "sports",
    searchTerm: "best selling sports equipment nike adidas under armour wilson spalding yeti coleman outdoor gear fitness", // Enhanced for brand diversity
    icon: Dumbbell,
    description: "Fitness and outdoor gear",
    displayName: "Sports & Outdoors"
  },
  {
    id: 21,
    name: "Athleisure",
    value: "athleisure",
    searchTerm: "athletic wear yoga pants leggings activewear nike adidas lululemon under armour alo yoga", // Enhanced for brand diversity
    icon: Dumbbell,
    description: "Athletic and activewear",
    displayName: "Athleisure & Activewear"
  },
  {
    id: 8,
    name: "Books",
    value: "books",
    searchTerm: "best selling books",
    icon: BookOpen,
    description: "Literature and educational",
    displayName: "Books & Media"
  },
  {
    id: 9,
    name: "Toys & Games",
    value: "toys",
    searchTerm: "toys games kids children educational puzzles building blocks dolls action figures", // Optimized for toy products
    icon: Gamepad2,
    description: "Fun for all ages"
  },
  {
    id: 11,
    name: "Arts & Crafts",
    value: "arts",
    searchTerm: "art supplies craft supplies drawing materials paint brushes canvas markers colored pencils craft kits scrapbook paper", // Optimized for better product relevance
    icon: Palette,
    description: "Creative supplies and tools",
    displayName: "Craft Supplies & Tools"
  },
  {
    id: 12,
    name: "Health",
    value: "health",
    searchTerm: "best wellness products",
    icon: Pill,
    description: "Wellness and self-care",
    displayName: "Health & Household"
  },
  {
    id: 13,
    name: "Baby",
    value: "baby",
    searchTerm: "best selling baby products",
    icon: Baby,
    description: "Baby care and essentials"
  },
  {
    id: 14,
    name: "Jewelry",
    value: "jewelry",
    searchTerm: "best selling jewelry",
    icon: Gem,
    description: "Fine and fashion jewelry"
  },
  {
    id: 15,
    name: "Kitchen",
    value: "kitchen",
    searchTerm: "best selling kitchen products",
    icon: Utensils,
    description: "Cooking and dining essentials"
  },
  {
    id: 16,
    name: "Tech",
    value: "tech",
    searchTerm: "best selling tech products electronics gadgets smart devices", // Enhanced
    icon: Monitor,
    description: "Technology and gadgets"
  },
  {
    id: 17,
    name: "Music",
    value: "music",
    searchTerm: "best selling music",
    icon: Music,
    description: "Musical instruments and audio"
  },
  {
    id: 18,
    name: "Gaming",
    value: "gaming",
    searchTerm: "best selling gaming",
    icon: Gamepad2,
    description: "Video games and accessories"
  },
  {
    id: 19,
    name: "Wedding",
    value: "wedding",
    searchTerm: "wedding gifts bridal party engagement ceremony reception decorations invitations favors",
    icon: PartyPopper,
    description: "Wedding essentials and gifts"
  },
  {
    id: 20,
    name: "Best Selling",
    value: "best-selling",
    searchTerm: "best selling top rated popular trending most bought bestseller",
    icon: Sparkles,
    description: "Top-rated and popular items"
  },
  {
    id: 23,
    name: "Gifts",
    value: "gifts",
    searchTerm: "best selling gifts",
    icon: Gift,
    description: "Perfect gift ideas"
  },
  {
    id: 24,
    name: "Bags & Purses",
    value: "bags-purses",
    searchTerm: "best selling bags purses",
    icon: ShoppingBag,
    description: "Handbags and accessories"
  }
];

// Helper functions for different component needs
export const getCategoryByValue = (value: string): Category | undefined => {
  return UNIVERSAL_CATEGORIES.find(cat => cat.value === value);
};

export const getCategoryName = (categoryUrl: string | null): string => {
  if (!categoryUrl) return "All Categories";
  const category = getCategoryByValue(categoryUrl);
  return category ? category.displayName || category.name : "All Products";
};

// Filtered categories for specific components
export const getFeaturedCategories = (): Category[] => {
  // Return 15 featured categories in alphabetical order
  return UNIVERSAL_CATEGORIES
    .filter(cat => 
      ['arts', 'athleisure', 'baby', 'beauty', 'best-selling', 'books', 'electronics', 'fashion', 'flowers', 'home', 'pets', 'sports', 'tech', 'toys', 'wedding'].includes(cat.value)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getQuickAccessCategories = (): Category[] => {
  // Return popular categories for quick access buttons, including Flowers as second
  return UNIVERSAL_CATEGORIES.filter(cat => 
    ['electronics', 'flowers', 'fashion', 'beauty', 'gaming', 'tech'].includes(cat.value)
  );
};

export const getDropdownCategories = (): Category[] => {
  // Return all categories with "All Categories" option
  return [
    {
      id: 0,
      name: "All Categories",
      value: "",
      searchTerm: "",
      description: "Browse all products"
    },
    ...UNIVERSAL_CATEGORIES
  ];
};

// Mobile optimization helpers
export const getMobileFriendlyCategories = (): Category[] => {
  // Return categories optimized for mobile display
  return UNIVERSAL_CATEGORIES.map(cat => ({
    ...cat,
    name: cat.name.length > 12 ? cat.name.split(' ')[0] : cat.name
  }));
};
