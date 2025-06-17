
import { ZincProduct } from '../types';

/**
 * Category mappings for different search terms
 */
const CATEGORY_MAPPINGS: Record<string, { category: string; brands: string[]; types: string[] }> = {
  // Footwear
  'shoes': { 
    category: 'Footwear', 
    brands: ['Nike', 'Adidas', 'Puma', 'New Balance', 'Under Armour', 'Reebok', 'Converse', 'Vans'],
    types: ['Running Shoes', 'Basketball Shoes', 'Casual Sneakers', 'Training Shoes', 'Lifestyle Shoes']
  },
  'sneakers': { 
    category: 'Footwear', 
    brands: ['Nike', 'Adidas', 'Jordan', 'Converse', 'Vans', 'Puma'],
    types: ['High-Top Sneakers', 'Low-Top Sneakers', 'Basketball Sneakers', 'Lifestyle Sneakers']
  },
  'boots': { 
    category: 'Footwear', 
    brands: ['Timberland', 'Dr. Martens', 'UGG', 'Red Wing', 'Wolverine'],
    types: ['Work Boots', 'Fashion Boots', 'Winter Boots', 'Hiking Boots']
  },
  
  // Electronics
  'phone': { 
    category: 'Electronics', 
    brands: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'],
    types: ['Smartphone', 'Mobile Phone', 'Android Phone', 'iPhone']
  },
  'laptop': { 
    category: 'Electronics', 
    brands: ['Apple', 'Dell', 'HP', 'Lenovo', 'Microsoft', 'ASUS'],
    types: ['MacBook', 'Gaming Laptop', 'Business Laptop', 'Ultrabook']
  },
  'headphones': { 
    category: 'Electronics', 
    brands: ['Apple', 'Sony', 'Bose', 'Beats', 'Sennheiser', 'Audio-Technica'],
    types: ['Wireless Headphones', 'Noise-Canceling Headphones', 'Gaming Headset', 'Earbuds']
  },
  
  // Clothing
  'shirt': { 
    category: 'Clothing', 
    brands: ['Nike', 'Adidas', 'Under Armour', 'Ralph Lauren', 'Tommy Hilfiger'],
    types: ['T-Shirt', 'Polo Shirt', 'Dress Shirt', 'Athletic Shirt']
  },
  'jacket': { 
    category: 'Clothing', 
    brands: ['Nike', 'Adidas', 'North Face', 'Patagonia', 'Columbia'],
    types: ['Windbreaker', 'Rain Jacket', 'Winter Jacket', 'Track Jacket']
  },
  
  // Sports Equipment
  'ball': { 
    category: 'Sports Equipment', 
    brands: ['Wilson', 'Spalding', 'Nike', 'Adidas', 'Rawlings'],
    types: ['Basketball', 'Football', 'Soccer Ball', 'Tennis Ball']
  }
};

/**
 * Detect the most relevant category for a search query
 */
const detectCategory = (query: string): { category: string; brands: string[]; types: string[] } => {
  const normalizedQuery = query.toLowerCase();
  
  // Check for exact matches first
  for (const [keyword, mapping] of Object.entries(CATEGORY_MAPPINGS)) {
    if (normalizedQuery.includes(keyword)) {
      return mapping;
    }
  }
  
  // Check for brand-specific searches
  const brandKeywords = ['nike', 'adidas', 'apple', 'samsung', 'sony'];
  for (const brand of brandKeywords) {
    if (normalizedQuery.includes(brand)) {
      // If it's a clothing/footwear brand with shoes/clothing terms
      if (['nike', 'adidas', 'under armour', 'puma'].includes(brand)) {
        if (normalizedQuery.includes('shoe') || normalizedQuery.includes('sneaker')) {
          return CATEGORY_MAPPINGS['shoes'];
        }
        if (normalizedQuery.includes('shirt') || normalizedQuery.includes('jacket')) {
          return CATEGORY_MAPPINGS['shirt'];
        }
      }
      
      // If it's a tech brand
      if (['apple', 'samsung', 'sony', 'google'].includes(brand)) {
        if (normalizedQuery.includes('phone')) {
          return CATEGORY_MAPPINGS['phone'];
        }
        if (normalizedQuery.includes('laptop') || normalizedQuery.includes('macbook')) {
          return CATEGORY_MAPPINGS['laptop'];
        }
        if (normalizedQuery.includes('headphone') || normalizedQuery.includes('earbud')) {
          return CATEGORY_MAPPINGS['headphones'];
        }
      }
    }
  }
  
  // Default fallback
  return {
    category: 'Electronics',
    brands: ['Apple', 'Samsung', 'Sony', 'Google', 'Microsoft'],
    types: ['Device', 'Gadget', 'Product', 'Technology', 'Equipment']
  };
};

/**
 * Extract brand preference from search query
 */
const extractBrandFromQuery = (query: string): string | null => {
  const normalizedQuery = query.toLowerCase();
  const allBrands = [
    'nike', 'adidas', 'puma', 'under armour', 'new balance', 'reebok', 'converse', 'vans',
    'apple', 'samsung', 'google', 'sony', 'microsoft', 'dell', 'hp', 'lenovo',
    'timberland', 'dr. martens', 'ugg', 'north face', 'patagonia'
  ];
  
  for (const brand of allBrands) {
    if (normalizedQuery.includes(brand)) {
      return brand.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  return null;
};

/**
 * Generate realistic product titles based on search context
 */
const generateRealisticTitle = (
  query: string, 
  brand: string, 
  productType: string, 
  index: number
): string => {
  const queryBrand = extractBrandFromQuery(query);
  const finalBrand = queryBrand || brand;
  
  // Generate model variations
  const modelSuffixes = ['Pro', 'Elite', 'Classic', 'Sport', 'Premium', 'Air', 'Max', 'Ultra'];
  const modelNumbers = ['2024', '2023', 'V2', 'V3', 'X', 'Plus'];
  const colors = ['Black', 'White', 'Red', 'Blue', 'Gray', 'Navy'];
  
  const modelSuffix = modelSuffixes[index % modelSuffixes.length];
  const modelNumber = modelNumbers[index % modelNumbers.length];
  const color = colors[index % colors.length];
  
  // Create realistic product names based on category
  if (productType.includes('Shoes') || productType.includes('Sneakers')) {
    return `${finalBrand} ${productType} ${modelSuffix} ${modelNumber} - ${color}`;
  } else if (productType.includes('Phone')) {
    return `${finalBrand} ${productType} ${modelNumber} (${color})`;
  } else if (productType.includes('Laptop')) {
    return `${finalBrand} ${productType} ${modelSuffix} ${modelNumber}`;
  } else {
    return `${finalBrand} ${productType} ${modelSuffix} ${modelNumber}`;
  }
};

/**
 * Generates mock product results for testing and fallback scenarios
 */
export const generateMockProductResults = (query: string, maxResults: number | string = 10): ZincProduct[] => {
  const count = typeof maxResults === 'string' ? parseInt(maxResults, 10) : maxResults;
  const normalizedCount = isNaN(count) ? 10 : Math.min(count, 100); // Cap at 100 items
  
  // Detect the appropriate category and brands for this search
  const categoryInfo = detectCategory(query);
  const preferredBrand = extractBrandFromQuery(query);
  
  console.log(`Generating ${normalizedCount} mock results for "${query}" in category: ${categoryInfo.category}`);
  
  const results: ZincProduct[] = [];
  
  for (let i = 0; i < normalizedCount; i++) {
    // Use preferred brand if found in query, otherwise cycle through category brands
    const brand = preferredBrand || categoryInfo.brands[i % categoryInfo.brands.length];
    const productType = categoryInfo.types[i % categoryInfo.types.length];
    
    // Generate realistic title
    const title = generateRealisticTitle(query, brand, productType, i);
    
    // Generate realistic pricing based on category
    let basePrice = 50;
    if (categoryInfo.category === 'Footwear') {
      basePrice = 80 + (i * 20); // $80-$280 range for shoes
    } else if (categoryInfo.category === 'Electronics') {
      if (productType.includes('Phone')) {
        basePrice = 200 + (i * 100); // $200-$1200 range for phones
      } else if (productType.includes('Laptop')) {
        basePrice = 500 + (i * 200); // $500-$2500 range for laptops
      } else {
        basePrice = 100 + (i * 50); // $100-$600 range for other electronics
      }
    } else if (categoryInfo.category === 'Clothing') {
      basePrice = 25 + (i * 15); // $25-$175 range for clothing
    }
    
    const price = Math.round(basePrice + (Math.random() * 50));
    
    // Generate realistic ratings (higher for established brands)
    const isEstablishedBrand = ['Nike', 'Apple', 'Samsung', 'Sony', 'Adidas'].includes(brand);
    const minRating = isEstablishedBrand ? 4.0 : 3.5;
    const rating = minRating + (Math.random() * (5.0 - minRating));
    
    const reviewCount = 50 + Math.floor(Math.random() * 950); // 50 to 999 reviews
    
    results.push({
      product_id: `MOCK${categoryInfo.category.substring(0, 3).toUpperCase()}${i}${Date.now().toString().slice(-6)}`,
      title: title,
      price: price,
      image: null, // Let the system generate a mock image
      description: `Experience the premium quality of ${brand} with this ${productType.toLowerCase()}. Featuring advanced technology, superior comfort, and exceptional durability. Perfect for ${categoryInfo.category.toLowerCase()} enthusiasts who demand the best.`,
      brand: brand,
      category: categoryInfo.category,
      retailer: "Amazon via Zinc",
      rating: Math.round(rating * 10) / 10, // Round to 1 decimal place
      review_count: reviewCount,
      isBestSeller: i < 3, // First 3 items are bestsellers
      features: [
        `Premium ${brand} quality`,
        "Advanced technology and design",
        "Superior comfort and performance",
        "Durable construction",
        "Authentic product guarantee"
      ]
    });
  }
  
  console.log(`Generated ${results.length} realistic mock results for "${query}" in ${categoryInfo.category} category`);
  return results;
};

/**
 * Creates mock results for specific product categories
 */
export const createMockResults = (
  title: string, 
  category: string, 
  count: number = 10,
  minRating: number = 4.0,
  maxRating: number = 5.0,
  brand: string = "Brand",
  includeBestsellers: boolean = false
): ZincProduct[] => {
  const results: ZincProduct[] = [];
  const actualCount = Math.min(count, 100); // Cap at 100 items
  
  for (let i = 0; i < actualCount; i++) {
    // Generate a realistic price based on category
    let basePrice = 50;
    if (category === 'Footwear') {
      basePrice = 80 + (i * 20);
    } else if (category === 'Electronics') {
      basePrice = 100 + (i * 100);
    } else if (category === 'Clothing') {
      basePrice = 25 + (i * 15);
    }
    
    const price = basePrice + (i % 100);
    
    // Generate a rating in the specified range
    const rating = minRating + (Math.random() * (maxRating - minRating));
    const reviewCount = 50 + Math.floor(Math.random() * 950); // 50 to 999 reviews
    
    const productId = `MOCK${category.substring(0, 3).toUpperCase()}${i}${Date.now().toString().slice(-4)}`;
    
    results.push({
      product_id: productId,
      title: `${brand} ${title} ${['Premium', 'Pro', 'Elite', 'Standard', 'Ultra'][i % 5]} Model ${i + 1}`,
      price: price,
      image: null, // Let the system generate a mock image
      description: `Top quality ${category} product from ${brand}. This ${title.toLowerCase()} features premium materials and exceptional craftsmanship.`,
      brand: brand,
      category: category,
      retailer: "Amazon via Zinc",
      rating: Math.round(rating * 10) / 10, // Round to 1 decimal place
      review_count: reviewCount,
      isBestSeller: includeBestsellers ? (i < 3) : false // First 3 items are bestsellers if enabled
    });
  }
  
  return results;
};
