import { ZINC_API_BASE_URL, getZincHeaders } from '../zincCore';
import { ZincOrderRequest, ZincOrder } from '../types';
import { GiftOptions } from '../../checkout/useCheckoutState';
import { toast } from "sonner";

/**
 * Creates a Zinc order request with gift options, delivery scheduling, and shipping method
 */
export const createZincOrderRequest = (
  products: { product_id: string; quantity: number }[],
  shippingAddress: any,
  billingAddress: any,
  paymentMethod: any,
  giftOptions: GiftOptions,
  retailer: string = "amazon",
  isTest: boolean = true,
  shippingMethod?: string
): ZincOrderRequest => {
  const orderRequest: ZincOrderRequest = {
    retailer,
    products,
    shipping_address: {
      first_name: shippingAddress.name.split(' ')[0] || '',
      last_name: shippingAddress.name.split(' ').slice(1).join(' ') || '',
      address_line1: shippingAddress.address,
      zip_code: shippingAddress.zipCode,
      city: shippingAddress.city,
      state: shippingAddress.state,
      country: shippingAddress.country,
      phone_number: '555-0123' // Default phone for demo
    },
    payment_method: {
      name_on_card: shippingAddress.name,
      number: '4111111111111111', // Demo card
      expiration_month: 12,
      expiration_year: 2025,
      security_code: '123'
    },
    billing_address: {
      first_name: shippingAddress.name.split(' ')[0] || '',
      last_name: shippingAddress.name.split(' ').slice(1).join(' ') || '',
      address_line1: shippingAddress.address,
      zip_code: shippingAddress.zipCode,
      city: shippingAddress.city,
      state: shippingAddress.state,
      country: shippingAddress.country,
      phone_number: '555-0123'
    },
    is_test: isTest
  };

  // Add shipping method if specified
  if (shippingMethod) {
    orderRequest.shipping_method = shippingMethod;
    console.log("Adding shipping method to order:", shippingMethod);
  }

  // Add gift options if this is a gift
  if (giftOptions.isGift) {
    orderRequest.is_gift = true;
    
    // Add gift message (truncated to 255 chars for Amazon compliance)
    if (giftOptions.giftMessage && giftOptions.giftMessage.trim()) {
      orderRequest.gift_message = giftOptions.giftMessage.substring(0, 255);
    }
    
    // Add delivery scheduling as delivery instructions
    const deliveryInstructions = [];
    
    if (giftOptions.scheduledDeliveryDate) {
      const deliveryDate = new Date(giftOptions.scheduledDeliveryDate);
      const formattedDate = deliveryDate.toLocaleDateString();
      deliveryInstructions.push(`Preferred delivery date: ${formattedDate}`);
      orderRequest.delivery_date_preference = giftOptions.scheduledDeliveryDate;
    }
    
    if (giftOptions.isSurpriseGift) {
      deliveryInstructions.push('This is a surprise gift - please ensure discreet packaging');
    }
    
    if (deliveryInstructions.length > 0) {
      orderRequest.delivery_instructions = deliveryInstructions.join('. ');
    }
  }

  return orderRequest;
};

/**
 * Process an order through the Zinc API
 * @param orderRequest The order request data
 * @returns The processed order data
 */
export const processOrder = async (orderRequest: ZincOrderRequest): Promise<ZincOrder | null> => {
  try {
    console.log("Processing order through Zinc API:", orderRequest);
    
    // Check if this is a test order
    const isTestOrder = orderRequest.is_test === true;
    if (isTestOrder) {
      console.log("This is a TEST order - will not actually charge your card or place an Amazon order");
      toast.info("This is a TEST order - no actual Amazon order will be placed");
    }
    
    // Log gift options being sent to Zinc
    if (orderRequest.is_gift) {
      console.log("Gift order details:", {
        gift_message: orderRequest.gift_message,
        delivery_instructions: orderRequest.delivery_instructions,
        delivery_date_preference: orderRequest.delivery_date_preference
      });
    }
    
    // Check for stored Amazon credentials
    const amazonCredentialsString = localStorage.getItem('amazonCredentials');
    if (amazonCredentialsString) {
      try {
        const amazonCredentials = JSON.parse(amazonCredentialsString);
        console.log("Using stored Amazon credentials for", amazonCredentials.email);
        
        // Add retailer credentials to the order request
        orderRequest.retailer_credentials = {
          email: amazonCredentials.email,
          password: amazonCredentials.password
        };
      } catch (error) {
        console.error("Error parsing Amazon credentials:", error);
      }
    } else {
      console.log("No Amazon credentials found in local storage");
    }
    
    // For test orders, we simulate the API response
    if (isTestOrder) {
      console.log("Simulating a Zinc API order response for test order");
      
      // Create a simulated response after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const testOrderId = 'test-' + Math.random().toString(36).substring(2, 15);
      
      return {
        id: testOrderId,
        status: "processing",
        created_at: new Date().toISOString(),
        retailer: orderRequest.retailer,
        products: orderRequest.products,
        total_price: 99.99, // Simulated price
      };
    }
    
    // For real orders, process through the Zinc API
    const response = await fetch(`${ZINC_API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getZincHeaders(),
      body: JSON.stringify(orderRequest),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Zinc API order error:", errorData);
      throw new Error(errorData.message || "Failed to process order");
    }
    
    const orderData = await response.json();
    console.log("Zinc order processed successfully:", orderData);
    
    return {
      id: orderData.request_id,
      status: "processing",
      created_at: new Date().toISOString(),
      retailer: orderRequest.retailer,
      products: orderRequest.products,
      total_price: orderData.price || 0,
    };
  } catch (error) {
    console.error("Error processing order:", error);
    toast.error("Failed to process order. Please try again.");
    return null;
  }
};

/**
 * Get the status of an order from the Zinc API
 * @param orderId The order ID
 * @returns The order status
 */
export const getOrderStatus = async (orderId: string): Promise<ZincOrder | null> => {
  try {
    const response = await fetch(`${ZINC_API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: getZincHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Zinc API order status error:", errorData);
      throw new Error(errorData.message || "Failed to get order status");
    }
    
    const orderData = await response.json();
    
    return {
      id: orderData.request_id,
      status: orderData.status,
      created_at: orderData.created_at,
      updated_at: orderData.updated_at,
      tracking_number: orderData.tracking_number,
      retailer: orderData.retailer,
      products: orderData.products,
      total_price: orderData.price,
    };
  } catch (error) {
    console.error("Error getting order status:", error);
    return null;
  }
};

export const cancelOrder = async (orderId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${ZINC_API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: getZincHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Zinc API order cancellation error:", errorData);
      throw new Error(errorData.message || "Failed to cancel order");
    }
    
    return true;
  } catch (error) {
    console.error("Error canceling order:", error);
    toast.error("Failed to cancel order. Please try again.");
    return false;
  }
};
