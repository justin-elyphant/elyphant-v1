
// Zinc API integration service
const ZINC_API_BASE_URL = 'https://api.zinc.io/v1';
const ZINC_API_KEY = '5B394AAF6CD03728E9E33DDF'; // This is a demo key - in production, use environment variables

export interface ZincProduct {
  product_id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
  brand?: string;
  category?: string;
  retailer: string;
}

export interface ZincOrder {
  id: string;
  status: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  date: string;
}

export interface ZincReturn {
  id: string;
  orderId: string;
  customerName: string;
  item: { name: string; price: number };
  reason: string;
  status: string;
  requestDate: string;
  completionDate: string | null;
  refundAmount: number | null;
  creditIssued: boolean;
}

/**
 * Fetch product details from Amazon via Zinc API
 */
export const fetchProductDetails = async (productId: string): Promise<ZincProduct | null> => {
  try {
    const url = `${ZINC_API_BASE_URL}/products/${productId}?retailer=amazon`;
    const headers = new Headers({'Authorization': 'Basic ' + btoa(`${ZINC_API_KEY}:`)});
    
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
  
  // Filter products based on query
  let results = allProducts.filter(product => 
    product.title.toLowerCase().includes(lowercaseQuery) || 
    (product.description && product.description.toLowerCase().includes(lowercaseQuery)) ||
    (product.category && product.category.toLowerCase().includes(lowercaseQuery))
  );
  
  // If no results, return some default items
  if (results.length === 0) {
    results = allProducts.slice(0, 3);
  }
  
  return results;
};

// Mock data for orders and returns until we implement the full API
export const getMockOrders = (): ZincOrder[] => {
  return [
    {
      id: "ord_123456",
      customerName: "Jane Smith",
      items: [
        { name: "Echo Dot (4th Gen)", quantity: 1, price: 49.99 }
      ],
      total: 49.99,
      status: "delivered",
      date: "2025-03-28T14:30:00Z"
    },
    {
      id: "ord_123457",
      customerName: "John Doe",
      items: [
        { name: "Kindle Paperwhite", quantity: 1, price: 139.99 }
      ],
      total: 139.99,
      status: "shipped",
      date: "2025-04-01T10:15:00Z"
    },
    {
      id: "ord_123458",
      customerName: "Alex Johnson",
      items: [
        { name: "Fire TV Stick 4K", quantity: 1, price: 49.99 },
        { name: "AirPods Pro", quantity: 1, price: 249.99 }
      ],
      total: 299.98,
      status: "processing",
      date: "2025-04-02T16:45:00Z"
    }
  ];
};

export const getMockReturns = (): ZincReturn[] => {
  return [
    {
      id: "ret_789012",
      orderId: "ord_123456",
      customerName: "Jane Smith",
      item: { name: "Echo Dot (4th Gen)", price: 49.99 },
      reason: "Defective product",
      status: "completed",
      requestDate: "2025-03-30T11:30:00Z",
      completionDate: "2025-04-02T14:45:00Z",
      refundAmount: 49.99,
      creditIssued: true
    },
    {
      id: "ret_789013",
      orderId: "ord_123457",
      customerName: "John Doe",
      item: { name: "Kindle Paperwhite", price: 139.99 },
      reason: "Changed mind",
      status: "in_transit",
      requestDate: "2025-04-02T09:15:00Z",
      completionDate: null,
      refundAmount: null,
      creditIssued: false
    },
    {
      id: "ret_789014",
      orderId: "ord_123458",
      customerName: "Alex Johnson",
      item: { name: "AirPods Pro", price: 249.99 },
      reason: "Incorrect item",
      status: "pending",
      requestDate: "2025-04-03T10:30:00Z",
      completionDate: null,
      refundAmount: null,
      creditIssued: false
    }
  ];
};
