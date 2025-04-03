
import { toast } from "sonner";

export interface ZincProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  vendor: string;
  description?: string;
  asin?: string;
  url?: string;
}

export interface ZincOrder {
  id: string;
  retailer: "amazon";
  products: {
    product_id: string;
    quantity: number;
  }[];
  shipping_address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
    phone_number: string;
  };
  is_gift?: boolean;
  gift_message?: string;
  webhooks?: {
    request_succeeded?: string;
    request_failed?: string;
    tracking_obtained?: string;
    order_placed?: string;
    order_failed?: string;
  };
  client_notes?: string;
  max_price?: number;
  shipping_method?: "standard" | "expedited" | "priority";
  payment_method: {
    name_on_card: string;
    number: string;
    security_code: string;
    expiration_month: number;
    expiration_year: number;
    use_gift: boolean;
  };
}

export interface ZincReturn {
  id: string;
  order_id: string;
  reason: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
  status: "pending" | "in_transit" | "completed" | "failed";
  return_type: "refund" | "replacement";
  notes?: string;
}

// Mock implementation of the Zinc service
// In a real implementation, this would make actual API calls to Zinc
export const zincService = {
  // Get Zinc API key from localStorage
  getApiKey: (): string | null => {
    try {
      const connection = JSON.parse(localStorage.getItem("zincConnection") || "{}");
      return connection.apiKey || null;
    } catch (e) {
      console.error("Error getting Zinc API key:", e);
      return null;
    }
  },
  
  // Search for products on Amazon via Zinc
  searchProducts: async (query: string): Promise<ZincProduct[]> => {
    const apiKey = zincService.getApiKey();
    if (!apiKey) {
      toast.error("Zinc API key not found");
      return [];
    }
    
    // This would be an actual API call to Zinc in a real implementation
    // For now, we'll return mock data
    console.log(`Searching for ${query} using Zinc API`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        id: 201,
        name: `Amazon Search: ${query}`,
        price: 129.99,
        category: "Electronics",
        image: "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: "Search result for " + query,
        asin: "B0123456789"
      }
    ];
  },
  
  // Place an order on Amazon via Zinc
  placeOrder: async (order: ZincOrder): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    const apiKey = zincService.getApiKey();
    if (!apiKey) {
      return { success: false, error: "Zinc API key not found" };
    }
    
    console.log("Placing order via Zinc API:", order);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful order creation
    return {
      success: true,
      orderId: "ord_" + Math.random().toString(36).substring(2, 8)
    };
  },
  
  // Get order details from Zinc
  getOrder: async (orderId: string): Promise<any> => {
    const apiKey = zincService.getApiKey();
    if (!apiKey) {
      return { success: false, error: "Zinc API key not found" };
    }
    
    console.log(`Getting order details for ${orderId} via Zinc API`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock order details
    return {
      id: orderId,
      status: "delivered",
      tracking: {
        carrier: "UPS",
        number: "1Z999AA10123456784"
      },
      items: [
        {
          name: "Echo Dot (4th Gen)",
          quantity: 1,
          price: 49.99
        }
      ],
      total: 49.99,
      shipping_address: {
        name: "Jane Smith",
        address_line1: "123 Main St",
        city: "San Francisco",
        state: "CA",
        zip_code: "94105"
      }
    };
  },
  
  // Request a return via Zinc
  requestReturn: async (returnData: ZincReturn): Promise<{ success: boolean; returnId?: string; error?: string }> => {
    const apiKey = zincService.getApiKey();
    if (!apiKey) {
      return { success: false, error: "Zinc API key not found" };
    }
    
    console.log("Requesting return via Zinc API:", returnData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful return request
    return {
      success: true,
      returnId: "ret_" + Math.random().toString(36).substring(2, 8)
    };
  },
  
  // Get return details from Zinc
  getReturn: async (returnId: string): Promise<any> => {
    const apiKey = zincService.getApiKey();
    if (!apiKey) {
      return { success: false, error: "Zinc API key not found" };
    }
    
    console.log(`Getting return details for ${returnId} via Zinc API`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock return details
    return {
      id: returnId,
      status: "completed",
      refund_amount: 49.99,
      items: [
        {
          name: "Echo Dot (4th Gen)",
          quantity: 1,
          price: 49.99
        }
      ]
    };
  }
};

export default zincService;
