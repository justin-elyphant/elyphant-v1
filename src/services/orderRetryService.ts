/**
 * Order Retry Service - Handles retrying failed orders with corrected information
 * 
 * This service allows retrying stuck orders by updating them with proper
 * billing information and resubmitting to Zinc or ZMA.
 */

import { supabase } from "@/integrations/supabase/client";
import { BillingInfo } from "./billingService";

export interface OrderRetryResult {
  success: boolean;
  message: string;
  zincOrderId?: string;
  zmaOrderId?: string;
  error?: string;
}

/**
 * Retries a failed order by updating it with billing information and resubmitting to appropriate service
 */
export const retryOrderWithBillingInfo = async (
  orderId: string, 
  billingInfo: BillingInfo,
  testMode = false
): Promise<OrderRetryResult> => {
  try {
    console.log(`🔄 Retrying order ${orderId} with billing info:`, billingInfo);
    
    // First, get the order to check its method
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('order_method, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !orderData) {
      throw new Error(`Failed to fetch order: ${fetchError?.message || 'Order not found'}`);
    }

    const orderMethod = orderData.order_method || 'zinc_api';
    console.log(`📋 Order method: ${orderMethod}`);
    
    // Update the order with billing information
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        billing_info: billingInfo,
        status: 'pending',
        zinc_status: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Error updating order with billing info:', updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    console.log('✅ Order updated with billing information');

    // Choose the appropriate processing function based on order method
    const functionName = orderMethod === 'zma' ? 'process-zma-order' : 'process-zinc-order';

    // Resubmit via the appropriate processing function
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { 
        orderId,
        isTestMode: testMode,
        debugMode: true,
        retryAttempt: true
      }
    });

    if (error) {
      console.error(`❌ Error invoking ${functionName}:`, error);
      throw new Error(`Failed to resubmit order: ${error.message}`);
    }

    if (data.success) {
      console.log('✅ Order retry successful:', data);
      
      // Determine the type of operation that was performed
      const operationType = data.retry ? 'retried via API' : 'reprocessed as new order';
      const externalOrderId = data.request_id || data.zincOrderId || data.zma_order_id;
      
      // Log the successful retry with proper UUID validation
      const currentUser = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;
      
      if (userId && orderId) {
        await supabase
          .from('order_notes')
          .insert({
            order_id: orderId, // Ensure this is the validated UUID from parameter
            admin_user_id: userId,
            note_content: `Order successfully ${operationType} with billing info. Cardholder: ${billingInfo.cardholderName}. ${orderMethod === 'zma' ? 'ZMA' : 'Zinc'} ${data.retry ? 'Request' : 'Order'} ID: ${externalOrderId}`,
            note_type: 'retry',
            is_internal: false
          });
      } else {
        console.warn('⚠️ Unable to log order note - missing user ID or order ID', { userId, orderId });
      }

      return {
        success: true,
        message: `Order successfully ${operationType} to ${orderMethod === 'zma' ? 'ZMA' : 'Zinc'}`,
        zincOrderId: data.zincOrderId || data.request_id,
        zmaOrderId: data.zma_order_id
      };
    } else {
      throw new Error(data.error || 'Unknown error during order retry');
    }

  } catch (error) {
    console.error('🚨 Order retry failed:', error);
    
    // Log the failed retry
    try {
      const user = await supabase.auth.getUser();
      await supabase
        .from('order_notes')
        .insert({
          order_id: orderId,
          admin_user_id: user.data.user?.id,
          note_content: `Order retry failed: ${error.message}`,
          note_type: 'error',
          is_internal: false
        });
    } catch (logError) {
      console.error('Error logging retry failure:', logError);
    }

    return {
      success: false,
      message: 'Order retry failed',
      error: error.message
    };
  }
};

/**
 * Gets orders that might need retrying (failed orders from the last 7 days)
 */
export const getOrdersNeedingRetry = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      zinc_status,
      order_method,
      zma_order_id,
      created_at,
      billing_info,
      shipping_info,
      total_amount
    `)
    .eq('status', 'failed')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders needing retry:', error);
    return [];
  }

  return orders || [];
};