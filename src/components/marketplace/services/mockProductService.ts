import { Product } from "@/contexts/ProductContext";
import { ZincProduct } from "../zinc/types";

/**
 * Consistent mock data for products to use across the application
 * This ensures stable testing of UI components without API dependencies
 */

// Mock product categories for filtering
export const productCategories = [
  "Electronics", 
  "Home", 
  "Fashion", 
  "Books", 
  "Toys", 
  "Sports",
  "Beauty",
  "Kitchen",
  "Outdoor"
];

// Mock brands for filtering
export const productBrands = [
  "Apple",
  "Samsung",
  "Nike",
  "Adidas",
  "Amazon",
  "Google",
  "Sony",
  "Bose",
  "Microsoft",
  "Nintendo"
];

// Base set of mock products to use everywhere
const baseMockProducts: Product[] = [
  {
    id: "mock-001",
    product_id: "mock-001",
    name: "Premium Wireless Headphones",
    title: "Premium Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    category: "Electronics",
    vendor: "Bose",
    rating: 4.7,
    stars: 4.7,
    reviewCount: 128,
    num_reviews: 128,
    brand: "Bose"
  },
  {
    id: "mock-002",
    product_id: "mock-002",
    name: "Smart Watch Series 5",
    title: "Smart Watch Series 5",
    description: "Track your fitness and stay connected with this premium smartwatch",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500",
    category: "Electronics",
    vendor: "Apple",
    rating: 4.9,
    stars: 4.9,
    reviewCount: 432,
    num_reviews: 432,
    brand: "Apple",
    isBestSeller: true
  },
  {
    id: "mock-003",
    product_id: "mock-003",
    name: "Running Shoes Air Max",
    title: "Running Shoes Air Max",
    description: "Comfortable running shoes with air cushion technology",
    price: 129.95,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    category: "Fashion",
    vendor: "Nike",
    rating: 4.5,
    stars: 4.5,
    reviewCount: 215,
    num_reviews: 215,
    brand: "Nike"
  },
  {
    id: "mock-004",
    product_id: "mock-004",
    name: "Portable Bluetooth Speaker",
    title: "Portable Bluetooth Speaker",
    description: "Waterproof portable speaker with amazing sound quality",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
    category: "Electronics",
    vendor: "Sony",
    rating: 4.3,
    stars: 4.3,
    reviewCount: 187,
    num_reviews: 187,
    brand: "Sony"
  },
  {
    id: "mock-005",
    product_id: "mock-005",
    name: "San Diego Padres Baseball Cap",
    title: "San Diego Padres Baseball Cap",
    description: "Official MLB San Diego Padres cap with team logo",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500",
    category: "Sports",
    vendor: "MLB Shop",
    rating: 4.8,
    stars: 4.8,
    reviewCount: 92,
    num_reviews: 92,
    brand: "New Era",
    isBestSeller: true
  },
  {
    id: "mock-006",
    product_id: "mock-006",
    name: "Coffee Gift Set",
    title: "Premium Coffee Gift Set",
    description: "Selection of gourmet coffee beans with brewing accessories",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1459755486867-b55449bb39ff?w=500",
    category: "Kitchen",
    vendor: "Elyphant",
    rating: 4.6,
    stars: 4.6,
    reviewCount: 64,
    num_reviews: 64,
    brand: "Coffee Lovers"
  },
  {
    id: "mock-007",
    product_id: "mock-007",
    name: "13-inch MacBook Pro",
    title: "13-inch MacBook Pro with M2 Chip",
    description: "The latest Apple MacBook Pro with powerful M2 processor",
    price: 1299.00,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
    category: "Electronics",
    vendor: "Apple",
    rating: 4.9,
    stars: 4.9,
    reviewCount: 302,
    num_reviews: 302,
    brand: "Apple"
  },
  {
    id: "mock-008",
    product_id: "mock-008",
    name: "Smart Home Starter Kit",
    title: "Smart Home Starter Kit",
    description: "Everything you need to automate your home, including smart bulbs and plugs",
    price: 199.95,
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500",
    category: "Home",
    vendor: "Amazon",
    rating: 4.4,
    stars: 4.4,
    reviewCount: 178,
    num_reviews: 178,
    brand: "Amazon"
  },
  {
    id: "mock-009",
    product_id: "mock-009",
    name: "Yoga Mat Premium",
    title: "Yoga Mat Premium Non-Slip",
    description: "Eco-friendly, non-slip yoga mat for comfortable practice",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500",
    category: "Sports",
    vendor: "Elyphant",
    rating: 4.7,
    stars: 4.7,
    reviewCount: 143,
    num_reviews: 143,
    brand: "Wellness"
  },
  {
    id: "mock-010",
    product_id: "mock-010",
    name: "Scented Candle Gift Set",
    title: "Luxury Scented Candle Gift Set",
    description: "Set of 3 premium scented candles perfect for gifting",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1608831540955-45cd139246dc?w=500",
    category: "Home",
    vendor: "Elyphant",
    rating: 4.8,
    stars: 4.8,
    reviewCount: 87,
    num_reviews: 87,
    brand: "Aroma"
  },
  {
    id: "mock-011",
    product_id: "mock-011",
    name: "Wireless Gaming Mouse",
    title: "Pro Wireless Gaming Mouse",
    description: "High-precision gaming mouse with customizable buttons",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1605773527852-c546a8584ea3?w=500",
    category: "Electronics",
    vendor: "Logitech",
    rating: 4.6,
    stars: 4.6,
    reviewCount: 219,
    num_reviews: 219,
    brand: "Logitech"
  },
  {
    id: "mock-012",
    product_id: "mock-012",
    name: "Birthday Gift Basket",
    title: "Ultimate Birthday Gift Basket",
    description: "Assorted treats and goodies perfect for birthday celebrations",
    price: 69.99,
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500",
    category: "Gifts",
    vendor: "Elyphant",
    rating: 4.9,
    stars: 4.9,
    reviewCount: 73,
    num_reviews: 73,
    brand: "Gifting Co.",
    isBestSeller: true
  }
];

/**
 * Returns a consistent set of mock products
 * @param count Number of products to return
 */
export const getMockProducts = (count?: number): Product[] => {
  console.log("getMockProducts: Getting mock products");
  if (count && count > 0 && count < baseMockProducts.length) {
    console.log(`getMockProducts: Returning ${count} products`);
    return baseMockProducts.slice(0, count);
  }
  console.log(`getMockProducts: Returning all ${baseMockProducts.length} products`);
  return baseMockProducts;
};

/**
 * Search within mock products - improved to always return results
 * @param query Search term
 * @param maxResults Maximum number of results to return
 */
export const searchMockProducts = (query: string, maxResults: number = 20): Product[] => {
  console.log(`searchMockProducts: Searching for "${query}"`);
  
  if (!query || typeof query !== 'string' || query.trim() === '') {
    console.log(`searchMockProducts: Empty query, returning default products`);
    return baseMockProducts.slice(0, maxResults);
  }

  const lowerQuery = query.toLowerCase().trim();
  
  const results = baseMockProducts
    .filter(product => {
      // Search in name, description, category, and brand
      try {
        return (
          (product.name && product.name.toLowerCase().includes(lowerQuery)) ||
          (product.description && product.description.toLowerCase().includes(lowerQuery)) ||
          (product.category && product.category.toLowerCase().includes(lowerQuery)) ||
          (product.brand && product.brand.toLowerCase().includes(lowerQuery))
        );
      } catch (e) {
        console.error("Error filtering product:", e);
        return false;
      }
    })
    .slice(0, maxResults);
  
  // Always return at least some products
  if (results.length === 0) {
    console.log(`searchMockProducts: No matches for "${query}", returning default products`);
    return baseMockProducts.slice(0, Math.min(5, maxResults));
  }
  
  console.log(`searchMockProducts: Found ${results.length} results for "${query}"`);
  return results;
};

/**
 * Convert mock products to ZincProduct format
 */
export const getZincMockProducts = (query: string, maxResults: number = 20): ZincProduct[] => {
  const results = searchMockProducts(query, maxResults);
  
  return results.map(product => ({
    product_id: product.product_id,
    title: product.name,
    price: product.price,
    image: product.image,
    images: [product.image],
    description: product.description,
    category: product.category,
    brand: product.brand,
    retailer: product.vendor,
    rating: product.rating,
    review_count: product.reviewCount,
    isBestSeller: product.isBestSeller
  }));
};

export default {
  getMockProducts,
  searchMockProducts,
  getZincMockProducts
};
