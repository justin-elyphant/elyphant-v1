/**
 * Utility functions for product image handling in marketplace
 */

/**
 * Get a fallback image based on product details
 */
export const getProductFallbackImage = (productName: string = "", productCategory: string = ""): string => {
  const name = productName.toLowerCase();
  const category = productCategory.toLowerCase();

  // Art & Collectibles
  if (
    category.includes('art') ||
    category.includes('collectible') ||
    name.includes('art') ||
    name.includes('collectible') ||
    name.includes('painting') ||
    name.includes('sculpture') ||
    name.includes('print')
  ) {
    const artImages = [
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=500&fit=crop", // Creative workspace/monitor
      "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=500&h=500&fit=crop", // Colorful code/monitor
      "https://images.unsplash.com/photo-1486718448742-163732cd1544?w=500&h=500&fit=crop", // Abstract art
      "https://images.unsplash.com/photo-1493397212122-2b85dda8106b?w=500&h=500&fit=crop" // Modern architecture/building
    ];
    return artImages[Math.floor(Math.random() * artImages.length)];
  }

  // Electronics & Tech category
  if (
    category.includes('electronic') || 
    category.includes('tech') || 
    name.includes('phone') || 
    name.includes('laptop') || 
    name.includes('camera') ||
    name.includes('headphone') ||
    name.includes('watch')
  ) {
    // Randomize between a few tech images
    const techImages = [
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&h=500&fit=crop", // Headphones
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop", // Smartphone
      "https://images.unsplash.com/photo-1504707748692-419802cf939d?w=500&h=500&fit=crop", // Laptop
      "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=500&h=500&fit=crop"  // Smartwatch
    ];
    return techImages[Math.floor(Math.random() * techImages.length)];
  }
  
  // Clothing & Fashion
  if (
    category.includes('cloth') || 
    category.includes('fashion') || 
    category.includes('apparel') || 
    name.includes('shirt') || 
    name.includes('shoe') || 
    name.includes('jacket') ||
    name.includes('dress')
  ) {
    const fashionImages = [
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&h=500&fit=crop", // Shoes
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&h=500&fit=crop", // Clothing
      "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&h=500&fit=crop", // Jacket
      "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=500&h=500&fit=crop"  // Dress
    ];
    return fashionImages[Math.floor(Math.random() * fashionImages.length)];
  }
  
  // Home & Kitchen
  if (
    category.includes('home') || 
    category.includes('kitchen') || 
    category.includes('furniture') || 
    name.includes('chair') || 
    name.includes('sofa') || 
    name.includes('table') ||
    name.includes('cook')
  ) {
    const homeImages = [
      "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=500&h=500&fit=crop", // Chair
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop", // Kitchen
      "https://images.unsplash.com/photo-1526657782461-9fe13402a841?w=500&h=500&fit=crop", // Table
      "https://images.unsplash.com/photo-1612955538814-5c81ca9e91e6?w=500&h=500&fit=crop"  // Home
    ];
    return homeImages[Math.floor(Math.random() * homeImages.length)];
  }
  
  // Toys & Games
  if (
    category.includes('toy') || 
    category.includes('game') || 
    name.includes('toy') || 
    name.includes('game') || 
    name.includes('puzzle') ||
    name.includes('doll')
  ) {
    const toyImages = [
      "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=500&h=500&fit=crop", // Toy
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&h=500&fit=crop", // Puzzle
      "https://images.unsplash.com/photo-1609372332255-611485350f25?w=500&h=500&fit=crop", // Game
      "https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=500&h=500&fit=crop"  // Board game
    ];
    return toyImages[Math.floor(Math.random() * toyImages.length)];
  }
  
  // Beauty & Health
  if (
    category.includes('beauty') || 
    category.includes('health') || 
    category.includes('cosmetic') || 
    name.includes('cream') || 
    name.includes('lotion') ||
    name.includes('makeup')
  ) {
    const beautyImages = [
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&h=500&fit=crop", // Makeup
      "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=500&h=500&fit=crop", // Skin cream
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=500&fit=crop", // Perfume
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&h=500&fit=crop"  // Beauty
    ];
    return beautyImages[Math.floor(Math.random() * beautyImages.length)];
  }
  
  // Default fallback images for anything else
  const defaultImages = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop", // Generic product
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop", // Generic product
    "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500&h=500&fit=crop", // Generic product
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop"  // Generic product
  ];

  return defaultImages[Math.floor(Math.random() * defaultImages.length)];
};

/**
 * Create a random identifier for product image URLs
 * to make cached images refresh
 */
export const getImageCacheBuster = (): string => {
  return `?cb=${Math.floor(Math.random() * 10000)}`;
};
