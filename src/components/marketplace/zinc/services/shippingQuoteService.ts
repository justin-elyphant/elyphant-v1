
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

    // Call Zinc Product Offers API to get real shipping costs
    if (request.retailer === "amazon" && request.products.length > 0) {
      const productId = request.products[0].product_id; // Use first product for quote
      
      console.log(`Calling Zinc Product Offers API for product: ${productId}`);
      
      const response = await fetch(`https://api.zinc.io/v1/products/${productId}/offers?retailer=amazon`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(ZINC_API_BASE_URL + ':')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Zinc API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.offers && data.offers.length > 0 && data.offers[0].shipping_options) {
        const shippingOptions = data.offers[0].shipping_options.map((option: any, index: number) => ({
          id: `zinc_option_${index}`,
          name: option.method || (option.price === 0 ? "Free Shipping" : "Standard Shipping"),
          price: option.price / 100, // Convert cents to dollars
          delivery_time: `${option.delivery_days || 3-5} business days`,
          description: option.method || "Amazon shipping"
        }));

        const zincResponse: ShippingQuoteResponse = {
          retailer: "amazon",
          shipping_options: shippingOptions
        };

        // Cache the response
        shippingQuoteCache.set(cacheKey, {
          data: zincResponse,
          timestamp: Date.now()
        });

        console.log("Real Zinc shipping quote fetched:", zincResponse);
        return zincResponse;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching shipping quote:", error);
    toast.error("Unable to fetch shipping options. Using default rates.");
    
    // Return fallback shipping options with fixed $6.99 rate
    return {
      retailer: request.retailer,
      shipping_options: [
        {
          id: "fallback_standard",
          name: "Standard Shipping",
          price: 6.99,
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
