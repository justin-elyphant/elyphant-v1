
import { ZincProduct } from '../types';

/**
 * Creates an array of mock results for a given search query
 * 
 * @param searchTerm - The search term
 * @param category - The product category
 * @param count - Number of results to generate
 * @param minRating - Minimum product rating (default: 3.0)
 * @param maxRating - Maximum product rating (default: 5.0)
 * @param brandName - Specific brand name to use (optional)
 */
export const createMockResults = (
  searchTerm: string,
  category: string,
  count: number = 10,
  minRating: number = 3.0,
  maxRating: number = 5.0,
  brandName?: string
): ZincProduct[] => {
  // Get appropriate image URLs based on category
  const imageUrls = getImageUrlsForCategory(category);
  
  // Generate product variations based on the search term
  const results: ZincProduct[] = [];
  
  // Create product name templates based on search term and category
  const productTemplates = getProductTemplates(searchTerm, category, brandName);
  
  // Generate the specified number of products
  for (let i = 0; i < count; i++) {
    // Calculate price based on index (to get variety)
    const basePrice = 50 + (i % 3) * 25;
    const price = basePrice + Math.floor(Math.random() * 50);
    
    // Select template and image
    const templateIndex = i % productTemplates.length;
    const imageIndex = i % imageUrls.length;
    
    // Generate random rating between min and max
    const rating = parseFloat((minRating + Math.random() * (maxRating - minRating)).toFixed(1));
    const reviewCount = Math.floor(20 + Math.random() * 980);
    
    // Create product
    results.push({
      product_id: `PROD-${i}-${Date.now()}`,
      title: productTemplates[templateIndex].replace('{i}', `${i + 1}`),
      price: price,
      image: imageUrls[imageIndex],
      description: generateDescription(searchTerm, category, price, rating),
      brand: brandName || getDefaultBrand(searchTerm, category),
      category: category,
      retailer: 'Elyphant',
      rating: rating,
      review_count: reviewCount
    });
  }
  
  return results;
};

/**
 * Get appropriate image URLs based on product category
 */
const getImageUrlsForCategory = (category: string): string[] => {
  // Base URL for placeholder images
  const placeholders = [
    '/placeholder.svg'
  ];
  
  // Return appropriate image URLs based on category
  switch(category.toLowerCase()) {
    case 'electronics':
    case 'apple':
    case 'samsung':
      return [
        'https://images.unsplash.com/photo-1585636877094-a9b4ea9df6b4?w=500',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500',
        'https://images.unsplash.com/photo-1592903297149-37fb25202dfa?w=500',
        'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500',
        'https://images.unsplash.com/photo-1626206390128-72905333e580?w=500'
      ];
    case 'footwear':
    case 'nike':
    case 'adidas':
    case 'shoes':
      return [
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500',
        'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=500',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
        'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=500'
      ];
    case 'sports':
      return [
        'https://images.unsplash.com/photo-1607962591309-3de78881aff1?w=500',
        'https://images.unsplash.com/photo-1615118265620-d8beabf6e8e5?w=500',
        'https://images.unsplash.com/photo-1511426463457-0571e247d816?w=500',
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500',
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500'
      ];
    case 'gaming':
      return [
        'https://images.unsplash.com/photo-1616427593347-c2e0f652bc8a?w=500',
        'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=500',
        'https://images.unsplash.com/photo-1605134370544-cf3cb9a2154f?w=500',
        'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=500',
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=500'
      ];
    default:
      return placeholders;
  }
};

/**
 * Generate product templates based on search term and category
 */
const getProductTemplates = (
  searchTerm: string, 
  category: string, 
  brandName?: string
): string[] => {
  const brand = brandName || getDefaultBrand(searchTerm, category);
  
  // Apple product templates
  if (brand.toLowerCase() === 'apple' || searchTerm.toLowerCase().includes('apple')) {
    return [
      "Apple iPhone Pro {i}",
      "Apple MacBook Air M3 {i}",
      "Apple iPad Pro {i}",
      "Apple Watch Series {i}",
      "Apple AirPods Pro {i}",
      "Apple TV 4K {i}",
      "Apple Magic Keyboard {i}",
      "Apple HomePod Mini {i}",
      "Apple AirTag {i} Pack",
      "Apple Pencil {i}th Generation"
    ];
  }
  
  // Samsung product templates
  if (brand.toLowerCase() === 'samsung' || searchTerm.toLowerCase().includes('samsung')) {
    return [
      "Samsung Galaxy S{i} Ultra",
      "Samsung Galaxy Tab S{i}",
      "Samsung Galaxy Watch {i}",
      "Samsung Galaxy Buds {i}",
      "Samsung QLED TV Q{i}0B",
      "Samsung 4K Smart TV {i}-Series",
      "Samsung Odyssey G{i} Gaming Monitor",
      "Samsung T{i} Portable SSD",
      "Samsung Galaxy Book {i} Pro",
      "Samsung Wireless Charger {i}0W"
    ];
  }
  
  // Nike product templates
  if (brand.toLowerCase() === 'nike' || searchTerm.toLowerCase().includes('nike')) {
    return [
      "Nike Air Max {i}0",
      "Nike Zoom Pegasus {i}",
      "Nike Dunk Low {i}",
      "Nike Air Force 1 '{i}",
      "Nike React Infinity Run {i}",
      "Nike Free Run {i}.0",
      "Nike SB Janoski {i}",
      "Nike Blazer Mid '{i}",
      "Nike Air Jordan {i}",
      "Nike Metcon {i}"
    ];
  }
  
  // Default templates with the search term
  return [
    `${brand} Premium ${searchTerm} {i}`,
    `${brand} ${searchTerm} Pro {i}`,
    `${brand} ${searchTerm} Elite {i}`,
    `${brand} ${searchTerm} Ultra {i}`,
    `${brand} ${searchTerm} Max {i}`,
    `${brand} ${searchTerm} Plus {i}`,
    `${brand} ${searchTerm} Advanced {i}`,
    `${brand} ${searchTerm} Classic {i}`,
    `${brand} ${searchTerm} Standard {i}`,
    `${brand} ${searchTerm} Deluxe {i}`
  ];
};

/**
 * Generate a detailed product description
 */
const generateDescription = (
  searchTerm: string, 
  category: string, 
  price: number,
  rating: number
): string => {
  const brand = getDefaultBrand(searchTerm, category);
  const isPremium = price > 100;
  const qualityLevel = rating >= 4.5 ? "premium" : (rating >= 4.0 ? "high-quality" : "reliable");
  
  // Category-specific descriptions
  if (category.toLowerCase() === 'electronics' || 
      category.toLowerCase() === 'apple' || 
      category.toLowerCase() === 'samsung') {
    return `This ${qualityLevel} ${brand} product features cutting-edge technology with an intuitive interface. 
    It offers seamless connectivity, all-day battery life, and exceptional performance. 
    Perfect for both work and entertainment, it comes with a 1-year warranty and free technical support. 
    Our customers consistently rate this product ${rating}/5 stars for its reliability and value.`;
  }
  
  if (category.toLowerCase() === 'footwear' || 
      category.toLowerCase() === 'nike' || 
      category.toLowerCase() === 'adidas' || 
      category.toLowerCase() === 'shoes') {
    return `Experience exceptional comfort with these ${qualityLevel} ${brand} shoes. 
    Featuring advanced cushioning technology and breathable materials, they're perfect for 
    all-day wear. The durable outsole provides excellent traction on various surfaces. 
    Available in multiple colors, these shoes combine style and functionality. 
    Rated ${rating}/5 stars by our customers for comfort and durability.`;
  }
  
  if (category.toLowerCase() === 'sports') {
    return `Elevate your game with this ${qualityLevel} ${brand} sports equipment. 
    Engineered for peak performance, it offers the perfect balance of power and control. 
    Made with durable materials to withstand intense use, this product is trusted by 
    professionals and amateurs alike. Comes with a satisfaction guarantee and 
    free shipping. Our customers give it ${rating}/5 stars for performance and value.`;
  }
  
  if (category.toLowerCase() === 'gaming') {
    return `Immerse yourself in the ultimate gaming experience with this ${qualityLevel} ${brand} gaming product. 
    Featuring responsive controls, high-definition graphics, and seamless connectivity, 
    it's designed for serious gamers. The ergonomic design ensures comfort during extended 
    gaming sessions. Includes all necessary accessories and a 2-year warranty. 
    Rated ${rating}/5 stars by our gaming community.`;
  }
  
  // Default generic description
  return `This ${qualityLevel} ${brand} ${searchTerm} offers exceptional value and performance. 
  Designed with user experience in mind, it combines functionality with elegant design. 
  ${isPremium ? 'Premium features include enhanced durability and extended warranty.' : 'Features include standard warranty and reliable performance.'} 
  Rated ${rating}/5 stars by our customers, it's a popular choice for its reliability and quality.`;
};

/**
 * Get default brand name based on search term and category
 */
const getDefaultBrand = (searchTerm: string, category: string): string => {
  // Extract brand from search term if possible
  const lowercaseSearch = searchTerm.toLowerCase();
  
  if (lowercaseSearch.includes('apple')) return 'Apple';
  if (lowercaseSearch.includes('samsung')) return 'Samsung';
  if (lowercaseSearch.includes('nike')) return 'Nike';
  if (lowercaseSearch.includes('adidas')) return 'Adidas';
  if (lowercaseSearch.includes('microsoft')) return 'Microsoft';
  if (lowercaseSearch.includes('sony')) return 'Sony';
  
  // Default brands by category
  switch (category.toLowerCase()) {
    case 'electronics': return 'TechElite';
    case 'footwear': return 'StepMaster';
    case 'sports': return 'ProAthlete';
    case 'gaming': return 'GameForce';
    default: return 'Elyphant';
  }
};
