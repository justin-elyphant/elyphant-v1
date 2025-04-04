
import { ZINC_API_BASE_URL, getZincHeaders } from '../zincCore';
import { ZincOrderRequest, ZincOrder } from '../types';
import { toast } from "sonner";

/**
 * Process an order through the Zinc API
 * @param orderRequest The order request data
 * @returns The processed order data
 */
export const processOrder = async (orderRequest: ZincOrderRequest): Promise<ZincOrder | null> => {
  try {
    console.log("Processing order through Zinc API:", orderRequest);
    
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

/**
 * Cancel an order through the Zinc API
 * @param orderId The order ID
 * @returns Whether the cancellation was successful
 */
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
