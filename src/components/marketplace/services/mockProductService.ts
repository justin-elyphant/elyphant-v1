
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
  
  // Add popular search products to improve search results
  const popularSearchProducts: Product[] = [
    {
      product_id: "nike-1",
      id: "nike-1",
      title: "Nike Air Max Running Shoes",
      name: "Nike Air Max Running Shoes",
      price: 129.99,
      image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/7fbc5e94-8d49-4730-a280-f19d3cfad0b0/air-max-90-mens-shoes-6n3vKB.png",
      images: [
        "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/7fbc5e94-8d49-4730-a280-f19d3cfad0b0/air-max-90-mens-shoes-6n3vKB.png",
        "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/32e70dd0-2334-4591-a9ac-97e5e31100a9/air-max-90-mens-shoes-6n3vKB.png"
      ],
      description: "Iconic Nike Air Max running shoes with maximum comfort and style",
      category: "Footwear",
      vendor: "Amazon via Zinc",
      rating: 4.8,
      reviewCount: 3252
    },
    {
      product_id: "nike-2",
      id: "nike-2",
      title: "Nike Dri-FIT Training T-Shirt",
      name: "Nike Dri-FIT Training T-Shirt",
      price: 34.99,
      image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/a8860607-6861-4343-bf57-6a09519cc207/dri-fit-mens-training-t-shirt-MPCN3k.png",
      images: [
        "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/a8860607-6861-4343-bf57-6a09519cc207/dri-fit-mens-training-t-shirt-MPCN3k.png",
        "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/e04aefd6-9489-44b6-b495-121d5cfb33a6/dri-fit-mens-training-t-shirt-MPCN3k.png"
      ],
      description: "Moisture-wicking Nike Dri-FIT technology keeps you cool during workouts",
      category: "Clothing",
      vendor: "Amazon via Zinc",
      rating: 4.6,
      reviewCount: 1873
    },
    {
      product_id: "nike-3",
      id: "nike-3",
      title: "Nike Revolution 6 Running Shoes",
      name: "Nike Revolution 6 Running Shoes",
      price: 89.99,
      image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/a3e7dead-1ad2-4c40-996d-93ebc9df0fca/revolution-6-road-running-shoes-8Vskf3.png",
      images: [
        "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/a3e7dead-1ad2-4c40-996d-93ebc9df0fca/revolution-6-road-running-shoes-8Vskf3.png",
        "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/83d4d3a8-148f-4780-8b2d-467fe5d33e3f/revolution-6-road-running-shoes-8Vskf3.png"
      ],
      description: "Lightweight Nike Revolution 6 running shoes with responsive cushioning",
      category: "Footwear",
      vendor: "Amazon via Zinc",
      rating: 4.7,
      reviewCount: 2145
    }
  ];
  
  // Return requested number of products, combining both arrays
  const allProducts = [...products, ...popularSearchProducts];
  console.log(`getMockProducts: Returning all ${allProducts.length} products`);
  return allProducts.slice(0, count);
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
  
  // Special handling for popular searches
  if (normalizedQuery.includes("nike") && normalizedQuery.includes("shoe")) {
    console.log("searchMockProducts: Special handling for Nike shoes");
    const nikeProducts = getMockProducts(24).filter(product => 
      (product.id?.includes("nike") || 
       (product.name?.toLowerCase() || "").includes("nike")) && 
      ((product.category?.toLowerCase() || "").includes("footwear") || 
       (product.name?.toLowerCase() || "").includes("shoe"))
    );
    
    // Add a special Nike shoe product if none found to ensure results
    if (nikeProducts.length === 0) {
      nikeProducts.push({
        product_id: "nike-shoes-1",
        id: "nike-shoes-1",
        title: "Nike Air Zoom Running Shoes",
        name: "Nike Air Zoom Running Shoes",
        price: 119.99,
        image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/i1-23d9eee4-96cc-4be8-943e-3c6a4fd401e0/air-zoom-pegasus-39-road-running-shoes-kmZSD6.png",
        images: ["https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/i1-23d9eee4-96cc-4be8-943e-3c6a4fd401e0/air-zoom-pegasus-39-road-running-shoes-kmZSD6.png"],
        description: "Latest Nike running shoes with advanced cushioning",
        category: "Footwear",
        vendor: "Amazon via Zinc",
        rating: 4.7,
        reviewCount: 856
      });
    }
    
    console.log(`searchMockProducts: Found ${nikeProducts.length} Nike shoe products`);
    return nikeProducts.slice(0, count);
  }
  
  const allProducts = getMockProducts(24); // Get a larger set to search from
  
  const filteredProducts = allProducts.filter(product => {
    if (!product) return false;
    
    const title = ((product.title || product.name || "") || "").toLowerCase();
    const description = (product.description || "").toLowerCase();
    const category = (product.category || "").toLowerCase();
    const brand = (product.brand || "").toLowerCase();
    
    // Check if any words in the query match
    const queryWords = normalizedQuery.split(" ");
    const matchesAnyWord = queryWords.some(word => 
      title.includes(word) || 
      description.includes(word) || 
      category.includes(word) ||
      brand.includes(word)
    );
    
    return title.includes(normalizedQuery) || 
           description.includes(normalizedQuery) || 
           category.includes(normalizedQuery) ||
           brand.includes(normalizedQuery) ||
           matchesAnyWord;
  });
  
  console.log(`searchMockProducts: Found ${filteredProducts.length} matching products`);
  
  // If no products found, provide some default ones
  if (filteredProducts.length === 0) {
    console.log("No matching products found, returning default mock products");
    return getMockProducts(count);
  }
  
  return filteredProducts.slice(0, count);
};
