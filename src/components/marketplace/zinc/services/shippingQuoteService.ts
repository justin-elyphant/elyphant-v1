
import { ZINC_API_BASE_URL, getZincHeaders } from '../zincCore';
import { toast } from "sonner";

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  delivery_time: string;
  description?: string;
}

export interface ShippingQuoteRequest {
  retailer: string;
  products: {
    product_id: string;
    quantity: number;
  }[];
  shipping_address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
}

export interface ShippingQuoteResponse {
  shipping_options: ShippingOption[];
  retailer: string;
  estimated_delivery_dates?: {
    [key: string]: string;
  };
}

// Cache for shipping quotes to avoid repeated API calls
const shippingQuoteCache = new Map<string, { data: ShippingQuoteResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const generateCacheKey = (request: ShippingQuoteRequest): string => {
  return JSON.stringify({
    retailer: request.retailer,
    products: request.products,
    address: request.shipping_address
  });
};

export const getShippingQuote = async (request: ShippingQuoteRequest): Promise<ShippingQuoteResponse | null> => {
  try {
    console.log("Fetching shipping quote for:", request);
    
    // Check cache first
    const cacheKey = generateCacheKey(request);
    const cached = shippingQuoteCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Using cached shipping quote");
      return cached.data;
    }

    // For Amazon (our current retailer), we'll simulate the API call since Zinc doesn't have a dedicated shipping quote endpoint
    // In real implementation, this would call the Zinc API shipping quote endpoint
    if (request.retailer === "amazon") {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockResponse: ShippingQuoteResponse = {
        retailer: "amazon",
        shipping_options: [
          {
            id: "amazon_standard",
            name: "Standard Shipping",
            price: 4.99,
            delivery_time: "3-5 business days",
            description: "Standard delivery"
          },
          {
            id: "amazon_prime",
            name: "Prime Shipping", 
            price: 0.00,
            delivery_time: "1-2 business days",
            description: "Free Prime delivery"
          },
          {
            id: "amazon_expedited",
            name: "Expedited Shipping",
            price: 9.99,
            delivery_time: "2-3 business days", 
            description: "Faster delivery"
          }
        ],
        estimated_delivery_dates: {
          "amazon_standard": new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          "amazon_prime": new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          "amazon_expedited": new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      // Cache the response
      shippingQuoteCache.set(cacheKey, {
        data: mockResponse,
        timestamp: Date.now()
      });

      console.log("Shipping quote fetched successfully:", mockResponse);
      return mockResponse;
    }

    // For real Zinc API implementation (when available):
    /*
    const response = await fetch(`${ZINC_API_BASE_URL}/shipping_quote`, {
      method: 'POST',
      headers: getZincHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Zinc API shipping quote error:", errorData);
      throw new Error(errorData.message || "Failed to get shipping quote");
    }

    const quoteData = await response.json();
    
    // Cache the response
    shippingQuoteCache.set(cacheKey, {
      data: quoteData,
      timestamp: Date.now()
    });

    return quoteData;
    */

    return null;
  } catch (error) {
    console.error("Error fetching shipping quote:", error);
    toast.error("Unable to fetch shipping options. Using default rates.");
    
    // Return fallback shipping options
    return {
      retailer: request.retailer,
      shipping_options: [
        {
          id: "fallback_standard",
          name: "Standard Shipping",
          price: 4.99,
          delivery_time: "3-5 business days"
        },
        {
          id: "fallback_express",
          name: "Express Shipping", 
          price: 12.99,
          delivery_time: "1-2 business days"
        }
      ]
    };
  }
};

export const clearShippingQuoteCache = (): void => {
  shippingQuoteCache.clear();
};
