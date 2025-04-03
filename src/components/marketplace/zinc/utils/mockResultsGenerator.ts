
import { ZincProduct } from '../types';
import { generateDescription } from './productDescriptionUtils';

// Image URLs for realistic product images
const imageUrls = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  "https://images.unsplash.com/photo-1608231387042-66d1773070a5",
  "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
  "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa",
  "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a",
  "https://images.unsplash.com/photo-1543508282-6319a3e2621f",
  "https://images.unsplash.com/photo-1556048219-bb6978360b84",
  "https://images.unsplash.com/photo-1572538498790-fff982d4d25a",
  "https://images.unsplash.com/photo-1581985673473-0784a7a44e39",
  "https://images.unsplash.com/photo-1558191053-8edcb01e1da3",
  "https://images.unsplash.com/photo-1579338559194-a162d19bf842",
  "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf",
  "https://images.unsplash.com/photo-1603787081207-362bcef7c144",
  "https://images.unsplash.com/photo-1605348532760-6753d2c43329",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d",
  "https://images.unsplash.com/photo-1593081891731-fda0877988da",
  "https://images.unsplash.com/photo-1556906781-9a412961c28c",
  "https://images.unsplash.com/photo-1576672843344-f01907a9d40c",
  "https://images.unsplash.com/photo-1600269452121-4f2416e55c28",
  "https://images.unsplash.com/photo-1560769629-975ec94e6a86"
];

const getRandomPrice = (min: number, max: number): number => {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
};

const getRandomImage = (): string => {
  const randomIndex = Math.floor(Math.random() * imageUrls.length);
  return `${imageUrls[randomIndex]}?w=500&h=500&fit=crop`;
};

// Improved product name generator with brand names
export const generateProductName = (baseQuery: string, category: string, index: number): string => {
  // Popular brands by category
  const brands = {
    "Footwear": ["Nike", "Adidas", "Puma", "New Balance", "Reebok", "Under Armour", "Asics", "Brooks", "Saucony"],
    "Electronics": ["Apple", "Samsung", "Sony", "LG", "Google", "Microsoft", "Bose", "JBL", "Beats"],
    "Clothing": ["Nike", "Adidas", "Calvin Klein", "Ralph Lauren", "Tommy Hilfiger", "Levi's", "Gap", "H&M", "Zara"],
    "Sports": ["Nike", "Adidas", "Under Armour", "Wilson", "Spalding", "Callaway", "Titleist", "Columbia", "The North Face"],
    "Gaming": ["Sony", "Microsoft", "Nintendo", "Razer", "Logitech", "Corsair", "SteelSeries", "HyperX", "Alienware"],
    "Home": ["Dyson", "KitchenAid", "Cuisinart", "Ninja", "Keurig", "Instant Pot", "iRobot", "Shark", "Breville"],
    "Beauty": ["Maybelline", "L'Oreal", "MAC", "Estee Lauder", "Clinique", "Fenty Beauty", "NARS", "Urban Decay", "Revlon"]
  };

  // Product types by category
  const productTypes = {
    "Footwear": ["Running Shoes", "Basketball Shoes", "Training Shoes", "Casual Sneakers", "Athletic Shoes", "Tennis Shoes", "Walking Shoes", "Hiking Boots", "Soccer Cleats"],
    "Electronics": ["Smartphone", "Tablet", "Laptop", "Headphones", "Wireless Earbuds", "Smart Watch", "Bluetooth Speaker", "TV", "Camera"],
    "Clothing": ["T-Shirt", "Hoodie", "Sweatpants", "Athletic Shorts", "Jacket", "Windbreaker", "Performance Shirt", "Leggings", "Track Suit"],
    "Sports": ["Jersey", "Sports Bag", "Water Bottle", "Fitness Tracker", "Compression Sleeve", "Ball", "Racket", "Golf Clubs", "Yoga Mat"],
    "Gaming": ["Console", "Controller", "Gaming Headset", "Gaming Mouse", "Gaming Keyboard", "Gaming Chair", "VR Headset", "Gaming Monitor", "Gaming Laptop"],
    "Home": ["Vacuum", "Blender", "Coffee Maker", "Air Purifier", "Robot Vacuum", "Smart Speaker", "Air Fryer", "Toaster Oven", "Pressure Cooker"],
    "Beauty": ["Foundation", "Mascara", "Lipstick", "Eyeshadow Palette", "Face Cream", "Serum", "Moisturizer", "Makeup Brush Set", "Perfume"]
  };

  // Use baseQuery to determine brand if it matches a known brand
  let brand = "";
  let productType = "";
  const normalizedQuery = baseQuery.toLowerCase();
  
  // Check for specific brand in the query
  for (const categoryKey in brands) {
    const categoryBrands = brands[categoryKey as keyof typeof brands];
    for (const b of categoryBrands) {
      if (normalizedQuery.includes(b.toLowerCase())) {
        brand = b;
        // If we found a brand and it matches the category, use this category
        category = categoryKey;
        break;
      }
    }
    if (brand) break;
  }
  
  // If no brand was found in the query, use a random one from the category
  if (!brand && brands[category as keyof typeof brands]) {
    const categoryBrands = brands[category as keyof typeof brands];
    brand = categoryBrands[Math.floor(Math.random() * categoryBrands.length)];
  } else if (!brand) {
    // Fallback if category doesn't exist
    brand = "Premium";
  }
  
  // Get product type from the category
  if (productTypes[category as keyof typeof productTypes]) {
    const categoryProductTypes = productTypes[category as keyof typeof productTypes];
    productType = categoryProductTypes[Math.floor(Math.random() * categoryProductTypes.length)];
  } else {
    // Fallback
    productType = "Product";
  }
  
  // For Nike specifically
  if (normalizedQuery.includes("nike")) {
    brand = "Nike";
    
    // List of Nike product lines
    const nikeProducts = [
      "Air Force 1", "Air Jordan", "Air Max", "Dunk", "Blazer", 
      "React", "Free Run", "Metcon", "Revolution", "Pegasus", 
      "Zoom", "Tempo", "Infinity Run", "Joyride", "Flyknit", 
      "SB", "Cortez", "Roshe", "Huarache", "Waffle"
    ];
    
    const nikeModels = ["'22", "'23", "Retro", "Elite", "Pro", "Ultra", "Premium", "Custom", "Limited Edition", "Signature"];
    const nikeColors = ["Black/White", "Red/Black", "Blue/Gray", "Green/White", "All White", "Triple Black", "Multi-Color"];
    
    const product = nikeProducts[Math.floor(Math.random() * nikeProducts.length)];
    const model = nikeModels[Math.floor(Math.random() * nikeModels.length)];
    const color = nikeColors[Math.floor(Math.random() * nikeColors.length)];
    
    return `Nike ${product} ${model} ${color} - ${index % 2 === 0 ? "Men's" : "Women's"} ${productType}`;
  }
  
  // Generate a model number for tech products
  const modelNumber = Math.floor(Math.random() * 1000);
  const modelSuffix = index % 3 === 0 ? " Pro" : index % 3 === 1 ? " Ultra" : " Plus";
  
  if (category === "Electronics" || category === "Gaming") {
    return `${brand} ${productType} ${modelNumber}${modelSuffix}`;
  }
  
  // Add some variety to the naming
  const adjectives = ["Premium", "Deluxe", "Performance", "Professional", "Signature", "Classic", "Modern", "Elite", "Essential"];
  const adjective = index % 5 === 0 ? `${adjectives[Math.floor(Math.random() * adjectives.length)]} ` : "";
  
  return `${brand} ${adjective}${productType}`;
};

export const createMockResults = (query: string, category: string, count: number): ZincProduct[] => {
  const results: ZincProduct[] = [];
  
  // Ensure we generate at least the requested number of products
  for (let i = 0; i < count; i++) {
    const title = generateProductName(query, category, i);
    const price = category === "Electronics" || category === "Gaming" 
      ? getRandomPrice(99, 999) 
      : getRandomPrice(29, 199);
    
    // Generate higher-quality descriptions
    const description = generateDescription(title, category);
    
    results.push({
      product_id: `mock-${i}-${Date.now()}`,
      title,
      price,
      image: getRandomImage(),
      description,
      category,
      brand: title.split(' ')[0], // Extract brand from the title
      retailer: "Elyphant" // Changed from "Amazon via Zinc"
    });
  }
  
  return results;
};
