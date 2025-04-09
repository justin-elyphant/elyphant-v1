
import { ZincProduct } from '../types';

/**
 * Generates mock product results for testing and fallback scenarios
 */
export const generateMockProductResults = (query: string, maxResults: number | string = 10): ZincProduct[] => {
  const count = typeof maxResults === 'string' ? parseInt(maxResults, 10) : maxResults;
  const normalizedCount = isNaN(count) ? 10 : Math.min(count, 100); // Cap at 100 items
  
  const productTypes = [
    "Smartphone", "Laptop", "Headphones", "Tablet", "Smartwatch", 
    "Camera", "TV", "Monitor", "Speaker", "Gaming Console"
  ];
  
  const brands = [
    "Apple", "Samsung", "Sony", "Google", "Microsoft", 
    "LG", "Dell", "HP", "Bose", "Amazon"
  ];
  
  const results: ZincProduct[] = [];
  
  // Use the query as part of the product name if provided
  const searchTerms = query.trim().split(/\s+/).filter(Boolean);
  
  for (let i = 0; i < normalizedCount; i++) {
    const brand = brands[i % brands.length];
    const productType = productTypes[i % productTypes.length];
    
    // Create product title using search terms if available
    let title = "";
    if (searchTerms.length > 0) {
      // Capitalize the first letter of each search term
      const capitalizedTerms = searchTerms.map(term => 
        term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()
      );
      
      title = `${brand} ${capitalizedTerms.join(' ')} ${productType} (2023 Model)`;
    } else {
      title = `${brand} ${productType} Pro ${2023 + (i % 3)} Edition`;
    }
    
    // Generate a realistic price between $49 and $1999
    const basePrice = [49, 99, 149, 199, 299, 399, 499, 699, 999, 1499, 1999][i % 11];
    const price = basePrice + (i % 100);
    
    // Generate a random rating between 3.5 and 5.0
    const rating = 3.5 + (Math.random() * 1.5);
    const reviewCount = 10 + Math.floor(Math.random() * 990); // 10 to 999 reviews
    
    results.push({
      product_id: `MOCK${i}${Date.now().toString().slice(-6)}`,
      title: title,
      price: price,
      image: null, // Let the system generate a mock image
      description: `Experience the amazing ${brand} ${productType} featuring the latest technology and premium design. Perfect for everyday use, this ${productType.toLowerCase()} offers outstanding performance and reliability.`,
      brand: brand,
      category: productType,
      retailer: "Amazon via Zinc",
      rating: rating,
      review_count: reviewCount,
      isBestSeller: i < 3, // First 3 items are bestsellers
      features: [
        `Latest ${brand} technology`,
        "High performance processor",
        "Premium design and build quality",
        "Extended battery life",
        "1-year warranty included"
      ]
    });
  }
  
  console.log(`Generated ${results.length} mock results for "${query}"`);
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
    // Generate a realistic price between $49 and $1999
    const basePrice = [49, 99, 149, 199, 299, 399, 499, 699, 999, 1499][i % 10];
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
      rating: rating,
      review_count: reviewCount,
      isBestSeller: includeBestsellers ? (i < 3) : false // First 3 items are bestsellers if enabled
    });
  }
  
  return results;
};
