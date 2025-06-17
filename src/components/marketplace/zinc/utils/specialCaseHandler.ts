
/**
 * Special case handler for specific product searches
 */
import { ZincProduct } from '../types';

/**
 * Get products for special case queries that need custom handling
 */
export const getSpecialCaseProducts = async (query: string): Promise<ZincProduct[] | null> => {
  const normalizedQuery = query.toLowerCase();
  
  // Dallas Cowboys merchandise
  if (normalizedQuery.includes('dallas cowboys') || normalizedQuery.includes('cowboys')) {
    return generateDallasCowboysProducts();
  }
  
  // Padres merchandise
  if (normalizedQuery.includes('padres') && (normalizedQuery.includes('hat') || normalizedQuery.includes('cap'))) {
    return generatePadresHatProducts();
  }
  
  // Made In kitchen products
  if (normalizedQuery.includes('made in') && normalizedQuery.includes('kitchen')) {
    return generateMadeInKitchenProducts();
  }
  
  return null; // No special case handling needed
};

/**
 * Generate Dallas Cowboys merchandise products
 */
const generateDallasCowboysProducts = (): ZincProduct[] => {
  const products: ZincProduct[] = [
    {
      product_id: 'DC001',
      title: 'Dallas Cowboys Official NFL Jersey',
      price: 99.99,
      description: 'Official Dallas Cowboys NFL jersey with authentic team colors and logo. Perfect for game day or showing your team spirit.',
      image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=400&fit=crop',
      brand: 'NFL',
      category: 'Sports Merchandise',
      retailer: 'Amazon via Zinc',
      rating: 4.8,
      review_count: 324,
      images: ['https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=400&fit=crop']
    },
    {
      product_id: 'DC002',
      title: 'Dallas Cowboys Star Logo Cap',
      price: 29.99,
      description: 'Classic Dallas Cowboys baseball cap featuring the iconic star logo. Adjustable fit with premium materials.',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop',
      brand: 'New Era',
      category: 'Sports Merchandise',
      retailer: 'Amazon via Zinc',
      rating: 4.7,
      review_count: 156,
      images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop']
    },
    {
      product_id: 'DC003',
      title: 'Dallas Cowboys Coffee Mug',
      price: 19.99,
      description: 'Start your morning right with this Dallas Cowboys ceramic coffee mug. Dishwasher and microwave safe.',
      image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop',
      brand: 'NFL',
      category: 'Sports Merchandise',
      retailer: 'Amazon via Zinc',
      rating: 4.5,
      review_count: 89,
      images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop']
    },
    {
      product_id: 'DC004',
      title: 'Dallas Cowboys Hoodie',
      price: 64.99,
      description: 'Comfortable Dallas Cowboys hoodie with team logo. Perfect for cooler weather and game watching.',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
      brand: 'NFL',
      category: 'Sports Merchandise',
      retailer: 'Amazon via Zinc',
      rating: 4.6,
      review_count: 203,
      images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop']
    },
    {
      product_id: 'DC005',
      title: 'Dallas Cowboys Car Decal',
      price: 9.99,
      description: 'Show your Cowboys pride on the road with this weather-resistant car decal.',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop',
      brand: 'NFL',
      category: 'Sports Merchandise',
      retailer: 'Amazon via Zinc',
      rating: 4.4,
      review_count: 67,
      images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop']
    }
  ];
  
  return products;
};

/**
 * Generate Padres hat products
 */
const generatePadresHatProducts = (): ZincProduct[] => {
  return [
    {
      product_id: 'PAD001',
      title: 'San Diego Padres Official Baseball Cap',
      price: 34.99,
      description: 'Official San Diego Padres baseball cap with authentic team colors and logo.',
      image: 'https://images.unsplash.com/photo-1590075865003-e48b276c4579?w=400&h=400&fit=crop',
      brand: 'New Era',
      category: 'Sports Merchandise',
      retailer: 'Amazon via Zinc',
      rating: 4.7,
      review_count: 142,
      images: ['https://images.unsplash.com/photo-1590075865003-e48b276c4579?w=400&h=400&fit=crop']
    }
  ];
};

/**
 * Generate Made In kitchen products
 */
const generateMadeInKitchenProducts = (): ZincProduct[] => {
  const products: ZincProduct[] = [
    {
      product_id: 'MI001',
      title: 'Made In Carbon Steel Pan',
      price: 129.99,
      description: 'Professional-grade carbon steel pan from Made In. Perfect for searing, sautéing, and high-heat cooking.',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
      brand: 'Made In',
      category: 'Kitchen',
      retailer: 'Amazon via Zinc',
      rating: 4.9,
      review_count: 287,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop']
    },
    {
      product_id: 'MI002',
      title: 'Made In Stainless Steel Cookware Set',
      price: 299.99,
      description: 'Complete 8-piece stainless steel cookware set from Made In. Restaurant-quality construction.',
      image: 'https://images.unsplash.com/photo-1584990722935-8cd8e6225543?w=400&h=400&fit=crop',
      brand: 'Made In',
      category: 'Kitchen',
      retailer: 'Amazon via Zinc',
      rating: 4.8,
      review_count: 156,
      images: ['https://images.unsplash.com/photo-1584990722935-8cd8e6225543?w=400&h=400&fit=crop']
    },
    {
      product_id: 'MI003',
      title: 'Made In Chef Knife',
      price: 159.99,
      description: 'Professional chef knife from Made In. Sharp, durable, and perfectly balanced for precision cutting.',
      image: 'https://images.unsplash.com/photo-1593618998160-e34014c00b04?w=400&h=400&fit=crop',
      brand: 'Made In',
      category: 'Kitchen',
      retailer: 'Amazon via Zinc',
      rating: 4.9,
      review_count: 234,
      images: ['https://images.unsplash.com/photo-1593618998160-e34014c00b04?w=400&h=400&fit=crop']
    }
  ];
  
  return products;
};
