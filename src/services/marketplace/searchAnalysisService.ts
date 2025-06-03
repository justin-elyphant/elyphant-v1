import { Product } from "@/types/product";

export interface SearchContext {
  gender?: 'men' | 'women' | 'boys' | 'girls' | 'unisex';
  ageGroup?: 'kids' | 'teens' | 'adults' | 'elderly';
  occasion?: 'birthday' | 'christmas' | 'wedding' | 'graduation' | 'anniversary' | 'valentines' | 'mothers-day' | 'fathers-day';
  recipientType?: 'friend' | 'family' | 'colleague' | 'romantic-partner' | 'child';
  productCategory?: string;
  isGiftContext?: boolean;
}

export interface DynamicFilterOptions {
  brands: string[];
  priceRanges: Array<{ label: string; min: number; max: number }>;
  categories: string[];
  attributes: Record<string, string[]>; // e.g., { size: ['S', 'M', 'L'], color: ['Red', 'Blue'] }
  occasions: string[];
  demographics: string[];
}

export interface DynamicFilterState {
  priceRange: [number, number];
  selectedBrands: string[];
  selectedCategories: string[];
  selectedAttributes: Record<string, string[]>;
  selectedOccasions: string[];
  selectedDemographics: string[];
  rating: number | null;
  freeShipping: boolean;
  favoritesOnly: boolean;
  sortBy: string;
}

const GENDER_KEYWORDS = {
  women: ['women', 'woman', 'female', 'lady', 'ladies', 'her', 'she', 'mom', 'mother', 'wife', 'girlfriend', 'sister', 'daughter'],
  men: ['men', 'man', 'male', 'guy', 'guys', 'him', 'he', 'dad', 'father', 'husband', 'boyfriend', 'brother', 'son'],
  boys: ['boy', 'boys', 'son', 'nephew', 'grandson'],
  girls: ['girl', 'girls', 'daughter', 'niece', 'granddaughter']
};

const AGE_KEYWORDS = {
  kids: ['kid', 'kids', 'child', 'children', 'toddler', 'baby'],
  teens: ['teen', 'teenager', 'teenage', 'adolescent'],
  adults: ['adult', 'grown-up'],
  elderly: ['elderly', 'senior', 'grandparent', 'grandmother', 'grandfather']
};

const OCCASION_KEYWORDS = {
  birthday: ['birthday', 'bday', 'birth day'],
  christmas: ['christmas', 'xmas', 'holiday', 'holidays'],
  wedding: ['wedding', 'bride', 'groom', 'bridal'],
  graduation: ['graduation', 'graduate', 'grad'],
  anniversary: ['anniversary'],
  valentines: ['valentine', 'valentines', 'romantic'],
  'mothers-day': ['mothers day', 'mother\'s day', 'mom day'],
  'fathers-day': ['fathers day', 'father\'s day', 'dad day']
};

const RECIPIENT_KEYWORDS = {
  friend: ['friend', 'buddy', 'pal'],
  family: ['family', 'relative', 'cousin'],
  colleague: ['colleague', 'coworker', 'boss', 'employee'],
  'romantic-partner': ['partner', 'spouse', 'lover', 'significant other'],
  child: ['child', 'kid', 'son', 'daughter']
};

export const analyzeSearchContext = (searchTerm: string): SearchContext => {
  const normalizedSearch = searchTerm.toLowerCase();
  const context: SearchContext = {};

  // Check if this is a gift context
  context.isGiftContext = /gift|present|surprise/.test(normalizedSearch);

  // Detect gender
  for (const [gender, keywords] of Object.entries(GENDER_KEYWORDS)) {
    if (keywords.some(keyword => normalizedSearch.includes(keyword))) {
      context.gender = gender as SearchContext['gender'];
      break;
    }
  }

  // Detect age group
  for (const [age, keywords] of Object.entries(AGE_KEYWORDS)) {
    if (keywords.some(keyword => normalizedSearch.includes(keyword))) {
      context.ageGroup = age as SearchContext['ageGroup'];
      break;
    }
  }

  // Detect occasion
  for (const [occasion, keywords] of Object.entries(OCCASION_KEYWORDS)) {
    if (keywords.some(keyword => normalizedSearch.includes(keyword))) {
      context.occasion = occasion as SearchContext['occasion'];
      break;
    }
  }

  // Detect recipient type
  for (const [recipient, keywords] of Object.entries(RECIPIENT_KEYWORDS)) {
    if (keywords.some(keyword => normalizedSearch.includes(keyword))) {
      context.recipientType = recipient as SearchContext['recipientType'];
      break;
    }
  }

  return context;
};

export const generateDynamicFilters = (products: Product[], searchContext: SearchContext): DynamicFilterOptions => {
  // Extract unique brands from products
  const brands = Array.from(new Set(
    products.map(p => p.brand).filter(Boolean)
  )).sort();

  // Extract categories
  const categories = Array.from(new Set(
    products.map(p => p.category).filter(Boolean)
  )).sort();

  // Generate price ranges based on actual product prices
  const prices = products.map(p => p.price).filter(p => p > 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  const priceRanges = generateSmartPriceRanges(minPrice, maxPrice);

  // Extract product attributes (this would be enhanced based on actual product data structure)
  const attributes: Record<string, string[]> = {};
  
  // If we have clothing context, add size/color filters
  if (isClothingCategory(categories) || searchContext.gender) {
    attributes.size = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    attributes.color = extractColorsFromProducts(products);
  }

  // Generate occasion filters based on context
  const occasions = searchContext.occasion ? [searchContext.occasion] : [];
  if (searchContext.isGiftContext) {
    occasions.push('birthday', 'christmas', 'anniversary');
  }

  // Generate demographic filters based on context
  const demographics = [];
  if (searchContext.gender) demographics.push(searchContext.gender);
  if (searchContext.ageGroup) demographics.push(searchContext.ageGroup);

  return {
    brands,
    priceRanges,
    categories,
    attributes,
    occasions,
    demographics
  };
};

const generateSmartPriceRanges = (min: number, max: number) => {
  const ranges = [];
  
  if (min < 25) ranges.push({ label: 'Under $25', min: 0, max: 25 });
  if (max > 25) ranges.push({ label: '$25 - $50', min: 25, max: 50 });
  if (max > 50) ranges.push({ label: '$50 - $100', min: 50, max: 100 });
  if (max > 100) ranges.push({ label: '$100 - $200', min: 100, max: 200 });
  if (max > 200) ranges.push({ label: 'Over $200', min: 200, max: Infinity });
  
  return ranges;
};

const isClothingCategory = (categories: string[]): boolean => {
  const clothingKeywords = ['clothing', 'apparel', 'fashion', 'shirts', 'pants', 'dresses'];
  return categories.some(cat => 
    clothingKeywords.some(keyword => cat.toLowerCase().includes(keyword))
  );
};

const extractColorsFromProducts = (products: Product[]): string[] => {
  // This would ideally extract colors from product names/descriptions
  // For now, return common colors
  return ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray', 'Pink', 'Purple'];
};
