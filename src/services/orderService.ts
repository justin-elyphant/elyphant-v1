
/*
 * ========================================================================
 * 🚨 CRITICAL ORDER SERVICE - DO NOT SIMPLIFY 🚨
 * ========================================================================
 * 
 * This service handles sophisticated order processing including:
 * - Order creation with complex data structures
 * - Integration with multiple database tables
 * - Address management and profile updates
 * - Support for multiple recipients and delivery groups
 * 
 * ⚠️  CRITICAL FEATURES:
 * - Creates orders with full item details
 * - Handles recipient assignments
 * - Manages delivery groups
 * - Saves shipping addresses to profiles
 * - Provides order retrieval and status updates
 * 
 * 🔗 DEPENDENCIES:
 * - Supabase client for database operations
 * - addressService for address management
 * - CartContext for cart item types
 * - Complex type definitions for recipients
 * 
 * 🚫 DO NOT REPLACE WITH simple order creation
 * 
 * ⚠️  REFACTORING NOTE:
 * This file is 217 lines and should be considered for breaking into
 * smaller, focused services:
 * - OrderCreationService
 * - OrderRetrievalService
 * - OrderStatusService
 * - AddressIntegrationService
 * 
 * ========================================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { ShippingInfo, GiftOptions } from "@/components/marketplace/checkout/useCheckoutState";
import { CartItem } from "@/contexts/CartContext";
import { DeliveryGroup } from "@/types/recipient";
import { addressService } from "./addressService";
import { FormAddress } from "@/utils/addressStandardization";

// CRITICAL: Order creation data interface
export interface CreateOrderData {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  shippingInfo: ShippingInfo;
  giftOptions: GiftOptions;
  paymentIntentId?: string;
  deliveryGroups?: DeliveryGroup[];
}

// CRITICAL: Order interface with all required fields
export interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  shipping_info: ShippingInfo;
  gift_message?: string;
  is_gift: boolean;
  scheduled_delivery_date?: string;
  is_surprise_gift: boolean;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
  zinc_order_id?: string;
  zinc_status?: string;
  tracking_number?: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  delivery_groups?: any[];
  order_items: OrderItem[];
}

// CRITICAL: Order item interface
export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  vendor?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  recipient_connection_id?: string;
  delivery_group_id?: string;
  recipient_gift_message?: string;
  scheduled_delivery_date?: string;
}

/*
 * 🎯 CREATE ORDER FUNCTION
 * 
 * This function creates a complete order with all necessary data
 * including items, recipients, and delivery information.
 * 
 * CRITICAL: This function handles complex order creation with:
 * - Multiple recipient support
 * - Delivery group assignments
 * - Address saving to profile
 * - Full order and item creation
 */
export const createOrder = async (orderData: CreateOrderData): Promise<Order> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create an order');
  }

  const hasMultipleRecipients = orderData.deliveryGroups && orderData.deliveryGroups.length > 0;

  console.log('Creating order with data:', orderData);

  // CRITICAL: Create the order with proper schema alignment
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      subtotal: orderData.subtotal,
      shipping_cost: orderData.shippingCost,
      tax_amount: orderData.taxAmount,
      total_amount: orderData.totalAmount,
      shipping_info: orderData.shippingInfo,
      gift_message: orderData.giftOptions.giftMessage || null,
      is_gift: orderData.giftOptions.isGift,
      scheduled_delivery_date: orderData.giftOptions.scheduledDeliveryDate || null,
      is_surprise_gift: orderData.giftOptions.isSurpriseGift,
      stripe_payment_intent_id: orderData.paymentIntentId,
      status: 'pending',
      payment_status: 'pending',
      has_multiple_recipients: hasMultipleRecipients,
      delivery_groups: orderData.deliveryGroups || []
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw new Error('Failed to create order: ' + orderError.message);
  }

  console.log('Order created successfully:', order.id);

  // CRITICAL: Create order items with recipient assignments
  const orderItems = orderData.cartItems.map(item => {
    const recipientAssignment = item.recipientAssignment;
    
    return {
      order_id: order.id,
      product_id: item.product.product_id,
      product_name: item.product.name || item.product.title,
      product_image: item.product.image,
      vendor: item.product.vendor,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
      recipient_connection_id: recipientAssignment?.connectionId || null,
      delivery_group_id: recipientAssignment?.deliveryGroupId || null,
      recipient_gift_message: recipientAssignment?.giftMessage || null,
      scheduled_delivery_date: recipientAssignment?.scheduledDeliveryDate || null
    };
  });

  const { data: createdItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    throw new Error('Failed to create order items: ' + itemsError.message);
  }

  console.log('Order items created successfully:', createdItems.length);

  // CRITICAL: Save shipping address to user's address book
  try {
    const shippingAddress: FormAddress = {
      street: orderData.shippingInfo.address,
      city: orderData.shippingInfo.city,
      state: orderData.shippingInfo.state,
      zipCode: orderData.shippingInfo.zipCode,
      country: orderData.shippingInfo.country
    };

    // Save as "Order Address" with current date
    const addressName = `Order Address - ${new Date().toLocaleDateString()}`;
    await addressService.saveAddressToProfile(user.id, shippingAddress, addressName, false);
    
    console.log('Shipping address saved to user profile');
  } catch (error) {
    console.error('Error saving shipping address to profile:', error);
    // Don't fail the order if address saving fails
  }

  return {
    ...order,
    order_items: createdItems
  };
};

/*
 * 🔗 CRITICAL: Order retrieval function
 * 
 * This function retrieves a complete order with all items
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  console.log('Fetching order by ID:', orderId);
  
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', orderId)
    .single();

  if (orderError) {
    console.error('Error fetching order:', orderError);
    return null;
  }

  console.log('Order fetched successfully:', order.order_number);
  return order;
};

/*
 * 🔗 CRITICAL: User orders retrieval function
 */
export const getUserOrders = async (): Promise<Order[]> => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return orders || [];
};

/*
 * 🔗 CRITICAL: Order status update function
 */
export const updateOrderStatus = async (orderId: string, status: string, updates: any = {}) => {
  console.log('Updating order status:', orderId, status, updates);
  
  const { error } = await supabase
    .from('orders')
    .update({
      status,
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status: ' + error.message);
  }

  console.log('Order status updated successfully');
};
