
import { Product } from "@/contexts/ProductContext";

/**
 * Get mock products for development
 * @param count Number of products to return (default: 12)
 * @returns Array of product objects
 */
export const getMockProducts = (count: number = 12): Product[] => {
  console.log("getMockProducts: Getting mock products");
  
  const products: Product[] = [
    {
      product_id: "mock-1",
      id: "mock-1",
      title: "Premium Wireless Headphones",
      name: "Premium Wireless Headphones",
      price: 129.99,
      image: "https://m.media-amazon.com/images/I/71+3+8VcGFL._AC_SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/71+3+8VcGFL._AC_SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71NTi82uBEL._AC_SL1500_.jpg"
      ],
      description: "High-quality wireless headphones with noise cancellation",
      category: "Electronics",
      vendor: "Amazon via Zinc",
      rating: 4.7,
      reviewCount: 2453
    },
    {
      product_id: "mock-2",
      id: "mock-2",
      title: "Fitness Tracker Pro",
      name: "Fitness Tracker Pro",
      price: 89.99,
      image: "https://m.media-amazon.com/images/I/61vjUCzQCaL._SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/61vjUCzQCaL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/61a2y1FCAJL._AC_SL1500_.jpg"
      ],
      description: "Advanced fitness tracker with heart rate monitoring",
      category: "Electronics",
      vendor: "Amazon via Zinc",
      rating: 4.5,
      reviewCount: 1872
    },
    {
      product_id: "mock-3",
      id: "mock-3",
      title: "Organic Cotton T-Shirt",
      name: "Organic Cotton T-Shirt",
      price: 24.99,
      image: "https://m.media-amazon.com/images/I/81YpuRoACeL._AC_SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/81YpuRoACeL._AC_SL1500_.jpg",
        "https://m.media-amazon.com/images/I/716QOWr4QFL._AC_SL1500_.jpg"
      ],
      description: "Soft, comfortable organic cotton t-shirt",
      category: "Clothing",
      vendor: "Amazon via Zinc",
      rating: 4.3,
      reviewCount: 954
    },
    {
      product_id: "mock-4",
      id: "mock-4",
      title: "Smart Home Speaker",
      name: "Smart Home Speaker",
      price: 79.99,
      image: "https://m.media-amazon.com/images/I/71Q9d6N7xkL._AC_SL1000_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/71Q9d6N7xkL._AC_SL1000_.jpg",
        "https://m.media-amazon.com/images/I/61XRmPxpxjL._AC_SL1000_.jpg"
      ],
      description: "Voice-controlled smart speaker with premium sound",
      category: "Electronics",
      vendor: "Amazon via Zinc",
      rating: 4.6,
      reviewCount: 3241
    },
    {
      product_id: "mock-5",
      id: "mock-5",
      title: "Stainless Steel Water Bottle",
      name: "Stainless Steel Water Bottle",
      price: 34.99,
      image: "https://m.media-amazon.com/images/I/61gT5GAwO5L._AC_SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/61gT5GAwO5L._AC_SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71ge7D9YO9L._AC_SL1500_.jpg"
      ],
      description: "Double-walled insulated water bottle keeps drinks cold for 24 hours",
      category: "Kitchen",
      vendor: "Amazon via Zinc",
      rating: 4.8,
      reviewCount: 1567
    },
    {
      product_id: "mock-6",
      id: "mock-6",
      title: "Bluetooth Portable Speaker",
      name: "Bluetooth Portable Speaker",
      price: 59.99,
      image: "https://m.media-amazon.com/images/I/71JB6hM6Z6L._AC_SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/71JB6hM6Z6L._AC_SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71rriOb64jL._AC_SL1500_.jpg"
      ],
      description: "Waterproof portable speaker with 20-hour battery life",
      category: "Electronics",
      vendor: "Amazon via Zinc",
      rating: 4.4,
      reviewCount: 2109
    },
    {
      product_id: "mock-7",
      id: "mock-7",
      title: "Yoga Mat",
      name: "Yoga Mat",
      price: 29.99,
      image: "https://m.media-amazon.com/images/I/61-mM1QLU7L._AC_SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/61-mM1QLU7L._AC_SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71Vhg+TlnYL._AC_SL1500_.jpg"
      ],
      description: "Non-slip yoga mat with carrying strap",
      category: "Sports",
      vendor: "Amazon via Zinc",
      rating: 4.5,
      reviewCount: 876
    },
    {
      product_id: "mock-8",
      id: "mock-8",
      title: "Cast Iron Skillet",
      name: "Cast Iron Skillet",
      price: 39.99,
      image: "https://m.media-amazon.com/images/I/71+Y+DrpVpL._AC_SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/71+Y+DrpVpL._AC_SL1500_.jpg",
        "https://m.media-amazon.com/images/I/81bKAcdc1GL._AC_SL1500_.jpg"
      ],
      description: "Pre-seasoned cast iron skillet for cooking and baking",
      category: "Kitchen",
      vendor: "Amazon via Zinc",
      rating: 4.7,
      reviewCount: 3452
    },
    {
      product_id: "mock-9",
      id: "mock-9",
      title: "LED Desk Lamp",
      name: "LED Desk Lamp",
      price: 49.99,
      image: "https://m.media-amazon.com/images/I/61cJJMt2EWL._AC_SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/61cJJMt2EWL._AC_SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71PNArM-0UL._AC_SL1500_.jpg"
      ],
      description: "Adjustable LED desk lamp with multiple brightness levels",
      category: "Home",
      vendor: "Amazon via Zinc",
      rating: 4.6,
      reviewCount: 1243
    },
    {
      product_id: "mock-10",
      id: "mock-10",
      title: "Wireless Gaming Mouse",
      name: "Wireless Gaming Mouse",
      price: 69.99,
      image: "https://m.media-amazon.com/images/I/61mpMH5TzkL._AC_SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/61mpMH5TzkL._AC_SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71c8eaWD8uL._AC_SL1500_.jpg"
      ],
      description: "High-precision wireless gaming mouse with programmable buttons",
      category: "Electronics",
      vendor: "Amazon via Zinc",
      rating: 4.8,
      reviewCount: 2876
    },
    {
      product_id: "mock-11",
      id: "mock-11",
      title: "Reusable Shopping Bags",
      name: "Reusable Shopping Bags",
      price: 19.99,
      image: "https://m.media-amazon.com/images/I/91XlgALBjdL._AC_SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/91XlgALBjdL._AC_SL1500_.jpg",
        "https://m.media-amazon.com/images/I/91g3VhM53xL._AC_SL1500_.jpg"
      ],
      description: "Set of 5 foldable reusable grocery bags",
      category: "Home",
      vendor: "Amazon via Zinc",
      rating: 4.4,
      reviewCount: 932
    },
    {
      product_id: "mock-12",
      id: "mock-12",
      title: "Bluetooth Earbuds",
      name: "Bluetooth Earbuds",
      price: 99.99,
      image: "https://m.media-amazon.com/images/I/61jBba1K-FL._AC_SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/61jBba1K-FL._AC_SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71zny7BTRlL._AC_SL1500_.jpg"
      ],
      description: "True wireless earbuds with noise cancellation",
      category: "Electronics",
      vendor: "Amazon via Zinc",
      rating: 4.5,
      reviewCount: 5243
    }
  ];
  
  console.log(`getMockProducts: Returning all ${products.length} products`);
  return products.slice(0, count);
};

/**
 * Search mock products by keyword
 * @param query Search query
 * @param count Maximum number of results to return (default: 12)
 * @returns Filtered array of product objects
 */
export const searchMockProducts = (query: string, count: number = 12): Product[] => {
  if (!query) return getMockProducts(count);
  
  const normalizedQuery = query.toLowerCase().trim();
  console.log(`searchMockProducts: Searching for "${normalizedQuery}"`);
  
  const allProducts = getMockProducts(24); // Get a larger set to search from
  
  const filteredProducts = allProducts.filter(product => {
    const title = (product.title || product.name || "").toLowerCase();
    const description = (product.description || "").toLowerCase();
    const category = (product.category || "").toLowerCase();
    
    return title.includes(normalizedQuery) || 
           description.includes(normalizedQuery) || 
           category.includes(normalizedQuery);
  });
  
  console.log(`searchMockProducts: Found ${filteredProducts.length} matching products`);
  return filteredProducts.slice(0, count);
};
