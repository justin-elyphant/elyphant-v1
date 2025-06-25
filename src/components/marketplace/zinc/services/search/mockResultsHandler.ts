
/**
 * Mock results handler with guaranteed valid pricing
 */
import { ZincProduct } from "../../types";

/**
 * Generate mock results with guaranteed valid pricing
 */
export const getMockResults = (query: string, maxResults: number): ZincProduct[] => {
  const normalizedQuery = query.toLowerCase();
  
  // Base mock products with guaranteed valid pricing
  const baseMockProducts: Partial<ZincProduct>[] = [
    {
      product_id: "mock-1",
      title: "Premium Wireless Headphones",
      price: 89.99,
      category: "Electronics",
      brand: "TechBrand",
      rating: 4.5,
      review_count: 1250,
      description: "High-quality wireless headphones with noise cancellation"
    },
    {
      product_id: "mock-2", 
      title: "Smart Fitness Watch",
      price: 199.99,
      category: "Electronics",
      brand: "FitTech",
      rating: 4.3,
      review_count: 890,
      description: "Advanced fitness tracking with heart rate monitoring"
    },
    {
      product_id: "mock-3",
      title: "Organic Coffee Blend",
      price: 24.99,
      category: "Food & Drinks",
      brand: "CoffeeMaster",
      rating: 4.7,
      review_count: 567,
      description: "Premium organic coffee beans from sustainable farms"
    },
    {
      product_id: "mock-4",
      title: "Luxury Skincare Set",
      price: 149.99,
      category: "Beauty",
      brand: "GlowCare",
      rating: 4.6,
      review_count: 734,
      description: "Complete skincare routine with natural ingredients"
    },
    {
      product_id: "mock-5",
      title: "Professional Chef Knife",
      price: 79.99,
      category: "Kitchen",
      brand: "ChefMaster",
      rating: 4.8,
      review_count: 423,
      description: "High-carbon steel knife for professional cooking"
    }
  ];
  
  // Query-specific mock products with valid pricing
  const querySpecificProducts: Record<string, Partial<ZincProduct>[]> = {
    'padres': [
      {
        product_id: "mock-padres-1",
        title: "San Diego Padres Official Baseball Cap",
        price: 29.99,
        category: "Sports Merchandise",
        brand: "MLB Official",
        rating: 4.5,
        review_count: 156,
        description: "Official San Diego Padres baseball cap with team logo"
      }
    ],
    'flowers': [
      {
        product_id: "mock-flowers-1", 
        title: "Fresh Rose Bouquet Delivery",
        price: 49.99,
        category: "Flowers",
        brand: "FlowerExpress",
        rating: 4.7,
        review_count: 289,
        description: "Beautiful fresh roses delivered same day"
      }
    ],
    'dallas cowboys': [
      {
        product_id: "mock-cowboys-1",
        title: "Dallas Cowboys Official Jersey",
        price: 89.99,
        category: "Sports Merchandise", 
        brand: "NFL Official",
        rating: 4.6,
        review_count: 234,
        description: "Official Dallas Cowboys team jersey"
      }
    ]
  };
  
  // Select appropriate mock products based on query
  let selectedProducts = baseMockProducts;
  
  for (const [key, products] of Object.entries(querySpecificProducts)) {
    if (normalizedQuery.includes(key)) {
      selectedProducts = [...products, ...baseMockProducts];
      break;
    }
  }
  
  // Convert to full ZincProduct format with guaranteed valid pricing
  const mockResults: ZincProduct[] = selectedProducts.slice(0, maxResults).map((product, index) => ({
    product_id: product.product_id || `mock-${index}`,
    title: product.title || "Mock Product",
    price: product.price || 49.99, // Guaranteed minimum price
    category: product.category || "General",
    brand: product.brand || "MockBrand",
    rating: product.rating || 4.0,
    review_count: product.review_count || 100,
    description: product.description || "High-quality product",
    image: generateMockImage(product.category || "General"),
    images: [generateMockImage(product.category || "General")],
    vendor: "Amazon via Zinc",
    isBestSeller: index < 2, // First two products are "best sellers"
    bestSellerType: index === 0 ? 'amazon_choice' : (index === 1 ? 'best_seller' : null),
    badgeText: index === 0 ? "Amazon's Choice" : (index === 1 ? "Best Seller" : null)
  }));
  
  console.log(`Generated ${mockResults.length} mock products with valid pricing for query: "${query}"`);
  
  return mockResults;
};

/**
 * Generate appropriate mock images based on category
 */
const generateMockImage = (category: string): string => {
  const categoryImages: Record<string, string> = {
    'Electronics': 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=400&fit=crop',
    'Sports Merchandise': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=400&fit=crop',
    'Flowers': 'https://images.unsplash.com/photo-1563181879-97a5fa27b8c4?w=400&h=400&fit=crop',
    'Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
    'Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    'Food & Drinks': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop'
  };
  
  return categoryImages[category] || 'https://images.unsplash.com/photo-1560472355-109703aa3edc?w=400&h=400&fit=crop';
};
