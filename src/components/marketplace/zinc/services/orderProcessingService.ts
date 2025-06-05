
import { ZINC_API_BASE_URL, getZincHeaders } from '../zincCore';
import { ZincOrderRequest, ZincOrder } from '../types';
import { GiftOptions } from '../../checkout/useCheckoutState';
import { toast } from "sonner";

/**
 * Creates a Zinc order request with gift options, delivery scheduling, and shipping method
 * Note: Amazon Business credentials are now handled server-side for security
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
      phone_number: '555-0123'
    },
    payment_method: {
      name_on_card: shippingAddress.name,
      number: '4111111111111111',
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

  if (shippingMethod) {
    orderRequest.shipping_method = shippingMethod;
    console.log("Adding shipping method to order:", shippingMethod);
  }

  if (giftOptions.isGift) {
    orderRequest.is_gift = true;
    
    if (giftOptions.giftMessage && giftOptions.giftMessage.trim()) {
      orderRequest.gift_message = giftOptions.giftMessage.substring(0, 255);
    }
    
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
 * Legacy function - now redirects to server-side processing
 * This function is kept for backward compatibility but now returns a warning
 */
export const processOrder = async (orderRequest: ZincOrderRequest): Promise<ZincOrder | null> => {
  console.warn("processOrder called - this function is deprecated. Use server-side processing instead.");
  
  toast.warning("Order processing has been moved to server-side for security. Please use the new checkout flow.");
  
  return null;
};

/**
 * Get the status of an order from the Zinc API
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
