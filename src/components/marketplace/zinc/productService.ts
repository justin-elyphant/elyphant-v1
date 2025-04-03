
import { ZincProduct } from './types';
import { ZINC_API_BASE_URL, getZincHeaders } from './zincCore';

/**
 * Fetch product details from Amazon via Zinc API
 */
export const fetchProductDetails = async (productId: string): Promise<ZincProduct | null> => {
  try {
    const url = `${ZINC_API_BASE_URL}/products/${productId}?retailer=amazon`;
    const headers = getZincHeaders();
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error('Zinc API error:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    return {
      product_id: data.product_id,
      title: data.title,
      price: data.price,
      image: data.images[0] || '/placeholder.svg',
      description: data.description,
      brand: data.brand,
      category: data.category,
      retailer: 'Amazon via Zinc'
    };
  } catch (error) {
    console.error('Error fetching product from Zinc:', error);
    return null;
  }
};

/**
 * Search for products on Amazon via Zinc API
 */
export const searchProducts = async (query: string): Promise<ZincProduct[]> => {
  console.log(`Searching products for query: ${query}`);
  
  if (!query || query.trim().length <= 2) {
    console.log('Search query too short, returning empty results');
    return [];
  }
  
  try {
    // In a real implementation, we would call the Zinc API
    // For now, we'll return mock data based on the query to simulate search results
    // This ensures we always get results quickly for testing
    
    console.log('Using mock search results for demo purposes');
    
    // Generate mock results based on search query
    const mockResults = getMockSearchResults(query);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockResults;
  } catch (error) {
    console.error('Error searching products via Zinc:', error);
    return [];
  }
};

// Helper function to generate mock search results based on query
const getMockSearchResults = (query: string): ZincProduct[] => {
  const lowercaseQuery = query.toLowerCase();
  
  // Additional products for specific queries
  const specificProducts: Record<string, ZincProduct[]> = {
    'nike shoes': [
      {
        product_id: "B0BQWPKHGS",
        title: "Nike Men's Revolution 6 Running Shoes",
        price: 69.99,
        image: "/placeholder.svg",
        description: "Lightweight, breathable mesh upper with cushioned midsole for comfort",
        category: "Shoes",
        brand: "Nike",
        retailer: "Amazon via Zinc"
      },
      {
        product_id: "B0BV28XZ5S",
        title: "Nike Women's Air Zoom Pegasus 39 Running Shoes",
        price: 119.99,
        image: "/placeholder.svg",
        description: "Responsive cushioning and secure support for running",
        category: "Shoes",
        brand: "Nike",
        retailer: "Amazon via Zinc"
      },
      {
        product_id: "B09MVZKNXZ",
        title: "Nike Kids' Team Hustle D 10 Basketball Shoe",
        price: 65.00,
        image: "/placeholder.svg",
        description: "Durable leather upper with foam midsole for youth athletes",
        category: "Shoes",
        brand: "Nike",
        retailer: "Amazon via Zinc"
      }
    ],
    'running shoes': [
      {
        product_id: "B0BQWPKHGS",
        title: "Nike Men's Revolution 6 Running Shoes",
        price: 69.99,
        image: "/placeholder.svg",
        description: "Lightweight, breathable mesh upper with cushioned midsole for comfort",
        category: "Shoes",
        brand: "Nike",
        retailer: "Amazon via Zinc"
      },
      {
        product_id: "B08KYLSQZC",
        title: "ASICS Men's Gel-Venture 8 Running Shoes",
        price: 64.95,
        image: "/placeholder.svg",
        description: "Trail running shoes with GEL technology cushioning system",
        category: "Shoes",
        brand: "ASICS",
        retailer: "Amazon via Zinc"
      }
    ],
    'bluetooth headphones': [
      {
        product_id: "B07V4KC6D8",
        title: "Bose QuietComfort 45 Headphones",
        price: 329.00,
        image: "/placeholder.svg",
        description: "Wireless Noise Cancelling Bluetooth Headphones",
        category: "Electronics",
        brand: "Bose",
        retailer: "Amazon via Zinc"
      },
      {
        product_id: "B09BJZ3NPX",
        title: "Sony WH-1000XM4 Wireless Headphones",
        price: 348.00,
        image: "/placeholder.svg",
        description: "Industry Leading Noise Cancelling Bluetooth Headphones",
        category: "Electronics",
        brand: "Sony",
        retailer: "Amazon via Zinc"
      }
    ]
  };
  
  // Base set of products
  const allProducts: ZincProduct[] = [
    {
      product_id: "B08N5KWB9H",
      title: "Echo Dot (4th Gen) Smart Speaker",
      price: 49.99,
      image: "/placeholder.svg",
      description: "Smart speaker with Alexa | Charcoal",
      category: "Electronics",
      retailer: "Amazon via Zinc"
    },
    {
      product_id: "B08DFPV5HL",
      title: "Kindle Paperwhite (8GB)",
      price: 139.99,
      image: "/placeholder.svg", 
      description: "Waterproof, high-resolution display",
      category: "Electronics",
      retailer: "Amazon via Zinc"
    },
    {
      product_id: "B07PVCVBN7",
      title: "Fire TV Stick 4K",
      price: 49.99,
      image: "/placeholder.svg",
      description: "Streaming device with Alexa Voice Remote",
      category: "Electronics",
      retailer: "Amazon via Zinc"
    },
    {
      product_id: "B095DVPT6N",
      title: "MacBook Pro 14-inch",
      price: 1999.99,
      image: "/placeholder.svg",
      description: "Apple MacBook Pro with M1 Pro chip",
      category: "Electronics",
      retailer: "Amazon via Zinc"
    },
    {
      product_id: "B09B9KGVDZ",
      title: "AirPods Pro (2nd Generation)",
      price: 249.99,
      image: "/placeholder.svg",
      description: "Active Noise Cancellation, Transparency mode",
      category: "Electronics",
      retailer: "Amazon via Zinc"
    },
    {
      product_id: "B07FZ8S74R",
      title: "Echo Show 10",
      price: 249.99,
      image: "/placeholder.svg",
      description: "HD smart display with motion and Alexa",
      category: "Electronics",
      retailer: "Amazon via Zinc"
    },
    {
      product_id: "B07V4KC6D8",
      title: "Bose QuietComfort 45 Headphones",
      price: 329.00,
      image: "/placeholder.svg",
      description: "Wireless Noise Cancelling Bluetooth Headphones",
      category: "Electronics",
      retailer: "Amazon via Zinc"
    },
    {
      product_id: "B07ZGLLWBT",
      title: "Nintendo Switch OLED Model",
      price: 349.99,
      image: "/placeholder.svg",
      description: "OLED Model with White Joy-Con",
      category: "Gaming",
      retailer: "Amazon via Zinc"
    },
    {
      product_id: "B09DL17CQC",
      title: "PlayStation 5 Console",
      price: 499.99,
      image: "/placeholder.svg",
      description: "Sony PlayStation 5 Digital Edition",
      category: "Gaming",
      retailer: "Amazon via Zinc"
    },
    {
      product_id: "B08K9GLGN8",
      title: "Oculus Quest 2",
      price: 299.99,
      image: "/placeholder.svg",
      description: "Advanced All-In-One Virtual Reality Headset",
      category: "Gaming",
      retailer: "Amazon via Zinc"
    }
  ];
  
  // Check for exact matches in our specific products first
  for (const key in specificProducts) {
    if (lowercaseQuery.includes(key)) {
      return specificProducts[key];
    }
  }
  
  // Then check for partial matches in specific product keys
  for (const key in specificProducts) {
    const keyTerms = key.split(' ');
    const queryTerms = lowercaseQuery.split(' ');
    
    // Check if any term in the query matches any term in a specific product key
    const hasMatch = keyTerms.some(keyTerm => 
      queryTerms.some(queryTerm => 
        keyTerm.includes(queryTerm) || queryTerm.includes(keyTerm)
      )
    );
    
    if (hasMatch) {
      return specificProducts[key];
    }
  }
  
  // Filter products based on query
  let results = allProducts.filter(product => 
    product.title.toLowerCase().includes(lowercaseQuery) || 
    (product.description && product.description.toLowerCase().includes(lowercaseQuery)) ||
    (product.category && product.category.toLowerCase().includes(lowercaseQuery)) ||
    (product.brand && product.brand.toLowerCase().includes(lowercaseQuery))
  );
  
  // If no results, return some default items
  if (results.length === 0) {
    results = allProducts.slice(0, 3);
  }
  
  return results;
};
