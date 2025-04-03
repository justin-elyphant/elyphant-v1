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
  const imageUrls = getImageUrlsForCategory(category, searchTerm, brandName);
  
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
 * Get appropriate image URLs based on product category and search term
 */
const getImageUrlsForCategory = (category: string, searchTerm: string, brandName?: string): string[] => {
  // Normalize inputs to lowercase for better matching
  const lowerCategory = category.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  const lowerBrand = brandName?.toLowerCase() || '';
  
  // Apple products
  if (lowerCategory === 'apple' || 
      lowerBrand === 'apple' || 
      lowerSearch.includes('apple') || 
      lowerSearch.includes('iphone') || 
      lowerSearch.includes('macbook') || 
      lowerSearch.includes('ipad')) {
    return [
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500',  // iPhone
      'https://images.unsplash.com/photo-1537589376225-5405c60a5bd8?w=500',  // MacBook
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',     // iPad
      'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=500',  // Apple Watch
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500'   // AirPods
    ];
  }
  
  // Samsung products
  if (lowerCategory === 'samsung' || 
      lowerBrand === 'samsung' || 
      lowerSearch.includes('samsung') || 
      lowerSearch.includes('galaxy')) {
    return [
      'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=500',  // Samsung phone
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=500',  // Samsung Galaxy
      'https://images.unsplash.com/photo-1578772901604-74fa5dd99c63?w=500',  // Samsung tablet
      'https://images.unsplash.com/photo-1585862729417-a561a4c32b53?w=500',  // Samsung TV
      'https://images.unsplash.com/photo-1522125123931-9283fcc490de?w=500'   // Samsung earbuds
    ];
  }
  
  // Nike products
  if (lowerCategory === 'nike' || 
      lowerBrand === 'nike' || 
      lowerSearch.includes('nike') || 
      lowerSearch.includes('shoes')) {
    return [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',  // Nike red
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=500', // Nike Air
      'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=500',  // Nike white
      'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=500',  // Nike black
      'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=500'   // Nike blue
    ];
  }
  
  // Electronics general
  if (lowerCategory === 'electronics') {
    return [
      'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=500',  // Electronic devices
      'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=500',  // Headphones
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',     // Speaker
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500',     // Tablet
      'https://images.unsplash.com/photo-1573739122661-d7dfb5e90404?w=500'   // Smart watch
    ];
  }
  
  // Gaming
  if (lowerCategory === 'gaming' || 
      lowerSearch.includes('xbox') || 
      lowerSearch.includes('playstation')) {
    return [
      'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500',  // PlayStation
      'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=500',  // Xbox
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500',  // Controller
      'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=500',  // Gaming setup
      'https://images.unsplash.com/photo-1616874535244-73aea5daadb9?w=500'   // Gaming laptop
    ];
  }
  
  // Footwear
  if (lowerCategory === 'footwear' || (lowerSearch.includes('shoe') && !lowerSearch.includes('nike'))) {
    return [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500',  // Sneakers
      'https://images.unsplash.com/photo-1520219806036-c1a27f59f9f6?w=500', // Boots
      'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=500', // Running shoes
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',    // Sneakers
      'https://images.unsplash.com/photo-1608667508764-33cf0726b13a?w=500'  // Designer shoes
    ];
  }
  
  // Sports
  if (lowerCategory === 'sports') {
    return [
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500',  // Sports equipment
      'https://images.unsplash.com/photo-1615118265620-d8beabf6e8e5?w=500',  // Football
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',  // Basketball
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500',  // Sports gear
      'https://images.unsplash.com/photo-1562771242-a02d9090c90c?w=500'      // Tennis
    ];
  }
  
  // Dallas Cowboys
  if (lowerSearch.includes('dallas') || lowerSearch.includes('cowboys')) {
    return [
      'https://images.unsplash.com/photo-1605548656432-3e8b5d24e4d7?w=500',  // Cowboys merch
      'https://images.unsplash.com/photo-1559511260-7f0d5b5e3aa2?w=500',     // Stadium
      'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=500',  // Jersey
      'https://images.unsplash.com/photo-1517650862521-d250412c425e?w=500',  // Helmet
      'https://images.unsplash.com/photo-1592850046119-a0f6d36e4e47?w=500'   // Football
    ];
  }
  
  // Check if there are any specific product types in the search term
  if (lowerSearch.includes('headphone') || lowerSearch.includes('earphone') || lowerSearch.includes('earbud')) {
    return [
      'https://images.unsplash.com/photo-1606400082777-ef05f3c5cde6?w=500',  // Headphones
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500',  // Earbuds
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=500',  // Headphones
      'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=500',  // Earphones
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500'   // Wireless earbuds
    ];
  }
  
  if (lowerSearch.includes('tv') || lowerSearch.includes('television')) {
    return [
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500',  // TV
      'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=500',  // TV in room
      'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500',  // Smart TV
      'https://images.unsplash.com/photo-1577979749830-f1d742b96791?w=500',  // TV screen
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500'   // TV with console
    ];
  }
  
  // Default generic images (fallback)
  return [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',  // Generic product
    'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500',  // Generic tech
    'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500',  // Generic box
    'https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?w=500',  // Shopping
    'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500'   // Generic product
  ];
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
