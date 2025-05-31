import { supabase } from "@/integrations/supabase/client";
import { ShippingInfo, GiftOptions } from "@/components/marketplace/checkout/useCheckoutState";
import { CartItem } from "@/contexts/CartContext";

export interface CreateOrderData {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  shippingInfo: ShippingInfo;
  giftOptions: GiftOptions;
  paymentIntentId?: string;
}

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
  zinc_order_id?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  vendor?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const createOrder = async (orderData: CreateOrderData): Promise<Order> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create an order');
  }

  // Create the order with gift options
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
      payment_status: 'pending'
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw new Error('Failed to create order');
  }

  // Create order items
  const orderItems = orderData.cartItems.map(item => ({
    order_id: order.id,
    product_id: item.product.product_id,
    product_name: item.product.name,
    product_image: item.product.image,
    vendor: item.product.vendor,
    quantity: item.quantity,
    unit_price: item.product.price,
    total_price: item.product.price * item.quantity
  }));

  const { data: createdItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    throw new Error('Failed to create order items');
  }

  return {
    ...order,
    order_items: createdItems
  };
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
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

  return order;
};

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

export const updateOrderStatus = async (orderId: string, status: string, updates: any = {}) => {
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
    throw new Error('Failed to update order status');
  }
};
