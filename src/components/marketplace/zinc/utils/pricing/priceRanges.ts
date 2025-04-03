
// Price ranges for different product categories
export const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  'Apple': { min: 199, max: 1299 },
  'iPhone': { min: 699, max: 1299 },
  'MacBook': { min: 899, max: 2499 },
  'iPad': { min: 329, max: 999 },
  'AirPods': { min: 129, max: 249 },
  'AppleWatch': { min: 199, max: 499 },
  'Samsung': { min: 199, max: 1099 },
  'SamsungPhone': { min: 599, max: 1099 },
  'SamsungTV': { min: 299, max: 1999 },
  'Nike': { min: 59, max: 149 },
  'Adidas': { min: 49, max: 129 },
  'Footwear': { min: 39, max: 149 },
  'Gaming': { min: 199, max: 499 },
  'PlayStation': { min: 299, max: 499 },
  'Xbox': { min: 249, max: 499 },
  'NintendoSwitch': { min: 199, max: 349 },
  'Headphones': { min: 49, max: 349 },
  'Speakers': { min: 29, max: 299 },
  'Sports': { min: 19, max: 199 },
  'Electronics': { min: 29, max: 999 },
  'Clothing': { min: 19, max: 99 },
  'Home': { min: 29, max: 199 },
  'Kitchen': { min: 19, max: 299 },
  'Beauty': { min: 9, max: 99 },
  'Toys': { min: 9, max: 79 },
  'Books': { min: 7, max: 29 }
};

// Default price range
export const DEFAULT_PRICE_RANGE = { min: 19, max: 199 };

/**
 * Generate a realistic price for a product based on category
 */
export const generatePrice = (category: string): number => {
  const range = PRICE_RANGES[category] || DEFAULT_PRICE_RANGE;
  const price = range.min + Math.random() * (range.max - range.min);
  
  // Round to nearest .99 or .95 for more realistic pricing
  const roundBase = Math.random() > 0.7 ? 0.95 : 0.99;
  return Math.floor(price) + roundBase;
};
