
import { ZincProduct } from '../types';
import { generateDescription } from './productDescriptionUtils';

// Price ranges for different product categories
const PRICE_RANGES: Record<string, { min: number; max: number }> = {
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
const DEFAULT_PRICE_RANGE = { min: 19, max: 199 };

/**
 * Generate a realistic price for a product based on category
 */
const generatePrice = (category: string): number => {
  const range = PRICE_RANGES[category] || DEFAULT_PRICE_RANGE;
  const price = range.min + Math.random() * (range.max - range.min);
  
  // Round to nearest .99 or .95 for more realistic pricing
  const roundBase = Math.random() > 0.7 ? 0.95 : 0.99;
  return Math.floor(price) + roundBase;
};

/**
 * Create realistic mock search results for a query
 */
export const createMockResults = (
  query: string, 
  category: string = 'Electronics', 
  count: number = 10, 
  minRating: number = 3.5, 
  maxRating: number = 5.0,
  brand?: string,
  accuratePricing: boolean = false
): ZincProduct[] => {
  const results: ZincProduct[] = [];
  
  // Create product variants with different attributes
  for (let i = 0; i < count; i++) {
    // Generate a product ID that's unique but repeatable for the same query
    const productId = `ZINC-${query.replace(/\s/g, '-')}-${i}`.substring(0, 24);
    
    // Generate a title that includes the query and some variations
    const title = generateTitle(query, category, brand, i);
    
    // Generate a rating between min and max, weighted toward higher ratings
    const rating = Number((minRating + Math.random() * (maxRating - minRating)).toFixed(1));
    
    // Generate a variable number of reviews
    const reviewCount = Math.floor(20 + Math.random() * 980);
    
    // Generate a realistic price based on category
    const price = accuratePricing ? generatePrice(category) : 19.99 + Math.floor(Math.random() * 180);
    
    // Generate a descriptive image URL
    const imageUrl = getProductImage(title, category);
    
    // Generate a detailed product description
    const description = generateDescription(title, category);
    
    results.push({
      product_id: productId,
      title: title,
      price: price,
      image: imageUrl,
      description: description,
      brand: brand || getBrandFromTitle(title),
      category: category,
      retailer: "Elyphant",
      rating: rating,
      review_count: reviewCount
    });
  }
  
  return results;
};

// Helper functions for title generation
function generateTitle(query: string, category: string, brand?: string, index?: number): string {
  // Standard title patterns
  const baseTitle = brand ? `${brand} ` : '';
  
  if (category === 'iPhone' || query.toLowerCase().includes('iphone')) {
    const models = ['13', '13 Pro', '13 Pro Max', '14', '14 Plus', '14 Pro', '14 Pro Max', '15', '15 Plus', '15 Pro'];
    const colors = ['Midnight', 'Starlight', 'Blue', 'Purple', 'Yellow', 'Green', 'Black', 'Silver', 'Gold'];
    const storage = ['64GB', '128GB', '256GB', '512GB', '1TB'];
    
    const model = models[index! % models.length];
    const color = colors[Math.floor(index! / models.length) % colors.length];
    const size = storage[Math.floor(index! / (models.length * colors.length)) % storage.length];
    
    return `Apple iPhone ${model} ${size} - ${color}`;
  }
  
  if (category === 'MacBook' || query.toLowerCase().includes('macbook')) {
    const models = ['Air', 'Pro 13"', 'Pro 14"', 'Pro 16"'];
    const specs = ['M1', 'M2', 'M3', 'M2 Pro', 'M3 Pro', 'M3 Max'];
    const storage = ['256GB', '512GB', '1TB', '2TB'];
    const colors = ['Space Gray', 'Silver', 'Midnight', 'Starlight'];
    
    const model = models[index! % models.length];
    const spec = specs[Math.floor(index! / models.length) % specs.length];
    const size = storage[Math.floor(index! / (models.length * specs.length)) % storage.length];
    const color = colors[Math.floor(index! / (models.length * specs.length * storage.length)) % colors.length];
    
    return `Apple MacBook ${model} ${spec} ${size} ${color}`;
  }
  
  // For Nike shoes
  if (category === 'Nike' || category === 'Footwear' || query.toLowerCase().includes('nike')) {
    const models = ['Air Max', 'Air Force 1', 'React', 'Dunk', 'Jordan', 'Revolution', 'Free Run', 'Pegasus', 'ZoomX'];
    const types = ['Running', 'Basketball', 'Training', 'Lifestyle', 'Walking', 'Tennis'];
    const colors = ['Black/White', 'White/Black', 'Gray/Blue', 'Red/Black', 'Navy/White', 'Green/Yellow'];
    
    const model = models[index! % models.length];
    const type = types[Math.floor(index! / models.length) % types.length];
    const color = colors[Math.floor(index! / (models.length * types.length)) % colors.length];
    
    return `Nike ${model} ${type} Shoes - ${color}`;
  }
  
  // For Samsung phones
  if (category === 'Samsung' || category === 'SamsungPhone' || query.toLowerCase().includes('samsung')) {
    const models = ['Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S22', 'Galaxy A53', 'Galaxy Z Flip4', 'Galaxy Z Fold4'];
    const colors = ['Phantom Black', 'Phantom White', 'Green', 'Lavender', 'Graphite', 'Burgundy'];
    const storage = ['128GB', '256GB', '512GB', '1TB'];
    
    const model = models[index! % models.length];
    const color = colors[Math.floor(index! / models.length) % colors.length];
    const size = storage[Math.floor(index! / (models.length * colors.length)) % storage.length];
    
    return `Samsung ${model} ${size} - ${color}`;
  }
  
  // Default to a generic title pattern
  const adjectives = ['Premium', 'Deluxe', 'Ultra', 'Pro', 'Advanced', 'Essential', 'Compact', 'Wireless'];
  const features = ['with Fast Charging', 'Waterproof', 'Slim Design', 'Extended Battery', 'Portable', 'Lightweight'];
  
  const adjective = adjectives[index! % adjectives.length];
  const feature = features[Math.floor(index! / adjectives.length) % features.length];
  
  return `${baseTitle}${adjective} ${query} ${feature}`;
}

// Extract a likely brand from a product title
function getBrandFromTitle(title: string): string {
  const commonBrands = [
    'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Microsoft', 'Dell', 'HP', 
    'LG', 'Bose', 'Sonos', 'Amazon', 'Google', 'Logitech', 'Levi\'s', 'Nintendo'
  ];
  
  for (const brand of commonBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Return the first word of the title as a fallback
  return title.split(' ')[0];
}

// Generate a product image URL based on title and category
function getProductImage(title: string, category: string): string {
  const lowerTitle = title.toLowerCase();
  const lowerCategory = category.toLowerCase();
  
  // Apple Products
  if (lowerTitle.includes('iphone')) {
    return 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop';
  }
  if (lowerTitle.includes('macbook')) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop';
  }
  if (lowerTitle.includes('ipad')) {
    return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop';
  }
  if (lowerTitle.includes('airpods')) {
    return 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=500&h=500&fit=crop';
  }
  if (lowerTitle.includes('apple watch')) {
    return 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop';
  }
  
  // Samsung Products
  if (lowerTitle.includes('samsung') && lowerTitle.includes('galaxy')) {
    return 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=500&h=500&fit=crop';
  }
  if (lowerTitle.includes('samsung') && lowerTitle.includes('tv')) {
    return 'https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=500&h=500&fit=crop';
  }
  
  // Gaming Consoles
  if (lowerTitle.includes('playstation') || lowerTitle.includes('ps5')) {
    return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop';
  }
  if (lowerTitle.includes('xbox')) {
    return 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500&h=500&fit=crop';
  }
  if (lowerTitle.includes('nintendo') || lowerTitle.includes('switch')) {
    return 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500&h=500&fit=crop';
  }
  
  // Footwear
  if (lowerTitle.includes('nike') && (lowerTitle.includes('shoe') || lowerTitle.includes('sneaker'))) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
  }
  if (lowerTitle.includes('adidas') && (lowerTitle.includes('shoe') || lowerTitle.includes('sneaker'))) {
    return 'https://images.unsplash.com/photo-1518894950606-4642a0c087f9?w=500&h=500&fit=crop';
  }
  
  // Fallbacks based on category
  if (lowerCategory.includes('electronics')) {
    return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&h=500&fit=crop';
  }
  if (lowerCategory.includes('footwear') || lowerCategory.includes('shoes')) {
    return 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=500&h=500&fit=crop';
  }
  if (lowerCategory.includes('sports')) {
    return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&h=500&fit=crop';
  }
  if (lowerCategory.includes('headphones')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
  }
  if (lowerCategory.includes('speakers')) {
    return 'https://images.unsplash.com/photo-1558537348-c0f8e733989d?w=500&h=500&fit=crop';
  }
  
  // Default fallback
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop';
}
