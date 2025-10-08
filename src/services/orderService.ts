
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
import { ShippingInfo } from "@/components/marketplace/checkout/useCheckoutState";
import { GiftOptions } from "@/types/gift-options";
import { CartItem } from "@/contexts/CartContext";
import { DeliveryGroup } from "@/types/recipient";
import { addressService } from "./addressService";
import { FormAddress } from "@/utils/addressStandardization";

/**
 * UUID validation helper function
 * Validates if a string is a proper UUID format
 */
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Converts recipient assignment values to database-compatible format
 * Handles "self" assignments and validates UUIDs
 */
const sanitizeRecipientData = (connectionId: string | null | undefined, deliveryGroupId: string | null | undefined) => {
  let sanitizedConnectionId = null;
  let sanitizedDeliveryGroupId = null;
  
  // Handle connection ID
  if (connectionId) {
    if (connectionId === 'self') {
      console.log('[ORDER SERVICE] Converting "self" connectionId to null for self-purchase');
      sanitizedConnectionId = null;
    } else if (isValidUUID(connectionId)) {
      sanitizedConnectionId = connectionId;
    } else {
      console.warn('[ORDER SERVICE] Invalid UUID for connectionId, setting to null:', connectionId);
      sanitizedConnectionId = null;
    }
  }
  
  // Handle delivery group ID
  if (deliveryGroupId) {
    if (deliveryGroupId === 'self') {
      console.log('[ORDER SERVICE] Converting "self" deliveryGroupId to null for self-purchase');
      sanitizedDeliveryGroupId = null;
    } else if (isValidUUID(deliveryGroupId)) {
      sanitizedDeliveryGroupId = deliveryGroupId;
    } else {
      console.warn('[ORDER SERVICE] Invalid UUID for deliveryGroupId, setting to null:', deliveryGroupId);
      sanitizedDeliveryGroupId = null;
    }
  }
  
  return {
    connectionId: sanitizedConnectionId,
    deliveryGroupId: sanitizedDeliveryGroupId
  };
};

// CRITICAL: Order creation data interface
export interface CreateOrderData {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  giftingFee: number;
  giftingFeeName?: string;
  giftingFeeDescription?: string;
  taxAmount: number;
  totalAmount: number;
  shippingInfo: ShippingInfo;
  giftOptions: GiftOptions;
  paymentIntentId?: string;
  stripeSessionId?: string; // Add this field
  deliveryGroups?: DeliveryGroup[];
  billingInfo?: {
    cardholderName: string;
    billingAddress?: {
      name: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
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
  variation_text?: string;
  selected_variations?: any;
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

  // CRITICAL: Create the order with proper schema alignment including gifting fee
  // NEW FLOW: All orders start as pending_payment (race condition fix)
  const isScheduledDelivery = orderData.giftOptions.scheduledDeliveryDate && orderData.giftOptions.scheduledDeliveryDate !== '';
  const orderStatus = 'pending_payment'; // Always start here
  const paymentStatus = 'pending'; // Will be updated by webhook
  
  console.log(`[ORDER SERVICE] Creating order with status: ${orderStatus}, payment_status: ${paymentStatus}, scheduled: ${isScheduledDelivery}`);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id, // CRITICAL: Fix RLS policy violation
      subtotal: orderData.subtotal,
      shipping_cost: orderData.shippingCost,
      tax_amount: orderData.taxAmount,
      gifting_fee: orderData.giftingFee,
      gifting_fee_name: orderData.giftingFeeName || 'Elyphant Gifting Fee',
      gifting_fee_description: orderData.giftingFeeDescription || 'Platform service fee',
      total_amount: orderData.totalAmount,
      shipping_info: orderData.shippingInfo,
      billing_info: orderData.billingInfo || null,
      gift_message: orderData.giftOptions.giftMessage || null,
      is_gift: orderData.giftOptions.isGift,
      scheduled_delivery_date: orderData.giftOptions.scheduledDeliveryDate || null,
      is_surprise_gift: orderData.giftOptions.isSurpriseGift,
      stripe_payment_intent_id: orderData.paymentIntentId,
      stripe_session_id: orderData.stripeSessionId,
      status: orderStatus,
      payment_status: paymentStatus,
      has_multiple_recipients: hasMultipleRecipients,
      delivery_groups: orderData.deliveryGroups || []
    } as any)
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw new Error('Failed to create order: ' + orderError.message);
  }

  console.log('Order created successfully:', order.id);

  // CRITICAL: Create order items with enhanced validation and error handling
  const orderItems = orderData.cartItems.map(item => {
    const recipientAssignment = item.recipientAssignment;
    
    // Enhanced validation for order item data
    const productName = item.product.name || item.product.title || 'Unknown Product';
    const productId = item.product.product_id || item.product.id || `temp_${Date.now()}`;
    const unitPrice = Number(item.product.price) || 0;
    const quantity = Number(item.quantity) || 1;
    
    // CRITICAL: Sanitize recipient data to handle "self" assignments and validate UUIDs
    const sanitizedRecipientData = sanitizeRecipientData(
      recipientAssignment?.connectionId,
      recipientAssignment?.deliveryGroupId
    );
    
    console.log('Creating order item:', {
      product_id: productId,
      product_name: productName,
      unit_price: unitPrice,
      quantity: quantity,
      total_price: unitPrice * quantity,
      original_connectionId: recipientAssignment?.connectionId,
      sanitized_connectionId: sanitizedRecipientData.connectionId,
      original_deliveryGroupId: recipientAssignment?.deliveryGroupId,
      sanitized_deliveryGroupId: sanitizedRecipientData.deliveryGroupId
    });
    
    return {
      order_id: order.id,
      product_id: productId,
      product_name: productName,
      product_image: item.product.image || null,
      vendor: item.product.vendor || null,
      quantity: quantity,
      unit_price: unitPrice,
      total_price: unitPrice * quantity,
      recipient_connection_id: sanitizedRecipientData.connectionId,
      delivery_group_id: sanitizedRecipientData.deliveryGroupId,
      recipient_gift_message: recipientAssignment?.giftMessage || orderData.giftOptions?.giftMessage || null,
      scheduled_delivery_date: recipientAssignment?.scheduledDeliveryDate || null,
      variation_text: item.variationText || null,
      selected_variations: item.selectedVariations ? JSON.parse(item.selectedVariations) : null
    };
  });

  console.log('Inserting order items:', orderItems);

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
    shipping_info: typeof (order as any).shipping_info === 'string' 
      ? JSON.parse((order as any).shipping_info as any)
      : (order as any).shipping_info,
    delivery_groups: Array.isArray((order as any).delivery_groups)
      ? (order as any).delivery_groups
      : ((typeof (order as any).delivery_groups === 'string' && (order as any).delivery_groups ? JSON.parse((order as any).delivery_groups) : (order as any).delivery_groups)),
    order_items: createdItems
} as unknown as Order;
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
  const normalized = {
    ...order,
    shipping_info: typeof (order as any).shipping_info === 'string' 
      ? JSON.parse((order as any).shipping_info as any)
      : (order as any).shipping_info,
    delivery_groups: Array.isArray((order as any).delivery_groups)
      ? (order as any).delivery_groups
      : ((typeof (order as any).delivery_groups === 'string' && (order as any).delivery_groups ? JSON.parse((order as any).delivery_groups) : (order as any).delivery_groups)),
  } as unknown as Order;
return normalized;
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

  return (orders || []).map((o: any) => ({
    ...o,
    shipping_info: typeof o.shipping_info === 'string' ? JSON.parse(o.shipping_info as any) : o.shipping_info,
    delivery_groups: Array.isArray(o.delivery_groups) ? o.delivery_groups : (typeof o.delivery_groups === 'string' && o.delivery_groups ? JSON.parse(o.delivery_groups) : o.delivery_groups),
    order_items: o.order_items || []
  })) as unknown as Order[];
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
