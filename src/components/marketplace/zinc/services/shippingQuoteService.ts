
import { supabase } from "@/integrations/supabase/client";
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

    if (request.retailer === "amazon" && request.products.length > 0) {
      const productId = request.products[0].product_id;
      
      console.log(`Fetching shipping quote for product: ${productId}`);
      
      // Call dedicated shipping quote edge function
      const { data, error } = await supabase.functions.invoke('get-shipping-quote', {
        body: {
          product_id: productId,
          zip_code: request.shipping_address.zip_code
        }
      });

      if (error || !data?.shipping_options) {
        console.error("Shipping quote failed:", error);
        throw new Error(error?.message || "No shipping options available");
      }

      const shippingOptions = data.shipping_options.map((option: any, index: number) => ({
        id: `shipping_${index}`,
        name: option.method || (option.price === 0 ? "Free Shipping" : "Standard Shipping"),
        price: (option.price || 0) / 100, // Convert cents to dollars
        delivery_time: option.delivery_days ? `${option.delivery_days} business days` : "3-5 business days",
        description: option.method || "Amazon shipping"
      }));

      const response: ShippingQuoteResponse = {
        retailer: "amazon",
        shipping_options: shippingOptions
      };

      // Cache the response
      shippingQuoteCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      console.log("Shipping quote fetched:", response);
      return response;
    }

    return null;
  } catch (error) {
    console.error("Error fetching shipping quote:", error);
    toast.error("Unable to fetch shipping options. Using default rates.");
    
    return {
      retailer: request.retailer,
      shipping_options: [
        {
          id: "fallback_standard",
          name: "Standard Shipping",
          price: 6.99,
          delivery_time: "3-5 business days"
        }
      ]
    };
  }
};

export const clearShippingQuoteCache = (): void => {
  shippingQuoteCache.clear();
};
