
import { 
  Smartphone, 
  Shirt, 
  Home, 
  Heart, 
  Dumbbell, 
  BookOpen, 
  Gamepad2, 
  Coffee, 
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
    searchTerm: "best selling electronics",
    icon: Smartphone,
    description: "Latest tech and gadgets",
    displayName: "Electronics & Accessories"
  },
  {
    id: 2,
    name: "Flowers",
    value: "flowers",
    searchTerm: "flowers for delivery",
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
    searchTerm: "best selling home products decor furniture accessories", // Enhanced for variety
    icon: Home,
    description: "Decor and household items",
    displayName: "Home & Garden"
  },
  {
    id: 6,
    name: "Beauty",
    value: "beauty",
    searchTerm: "best selling beauty products",
    icon: Heart,
    description: "Skincare and cosmetics",
    displayName: "Beauty & Personal Care"
  },
  {
    id: 7,
    name: "Sports",
    value: "sports",
    searchTerm: "best selling sports equipment",
    icon: Dumbbell,
    description: "Fitness and outdoor gear",
    displayName: "Sports & Outdoors"
  },
  {
    id: 21,
    name: "Athleisure",
    value: "athleisure",
    searchTerm: "athletic wear yoga pants leggings activewear",
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
    searchTerm: "best selling toys games",
    icon: Gamepad2,
    description: "Fun for all ages"
  },
  {
    id: 10,
    name: "Food & Drinks",
    value: "food",
    searchTerm: "best gourmet food",
    icon: Coffee,
    description: "Gourmet and specialty items"
  },
  {
    id: 11,
    name: "Arts & Crafts",
    value: "arts",
    searchTerm: "best arts crafts",
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
    searchTerm: "best selling tech products",
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
    name: "Wedding & Party",
    value: "wedding-party",
    searchTerm: "best selling wedding party",
    icon: PartyPopper,
    description: "Celebration essentials"
  },
  {
    id: 20,
    name: "Gifts",
    value: "gifts",
    searchTerm: "best selling gifts",
    icon: Gift,
    description: "Perfect gift ideas"
  },
  {
    id: 22,
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
  // Return the first 12 categories for the featured section (including the new Pets category)
  return UNIVERSAL_CATEGORIES.slice(0, 12);
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
