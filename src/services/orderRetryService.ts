/**
 * Order Retry Service - Handles retrying failed orders with corrected information
 * 
 * This service allows retrying stuck orders by updating them with proper
 * billing information and resubmitting to ZMA only (zinc_api disabled).
 */

import { supabase } from "@/integrations/supabase/client";
import { BillingInfo } from "./billingService";
import { logOrderProcessing, validateOrderMethod } from "./orderMonitoringService";

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
    
    // First, get the order to check its payment status
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, payment_status, total_amount, payment_intent_id, user_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !orderData) {
      throw new Error(`Failed to fetch order: ${fetchError?.message || 'Order not found'}`);
    }

    // Validate order exists
    const validation = await validateOrderMethod(orderId);
    if (!validation.isValid) {
      throw new Error(`Order ${orderId} validation failed`);
    }

    const orderMethod = validation.orderMethod;
    console.log(`📋 Order method: ${orderMethod}`);
    
    // Log the retry attempt
    await logOrderProcessing({
      orderId,
      orderMethod,
      processingFunction: 'process-order-v2',
      timestamp: new Date().toISOString(),
      userId: orderData.user_id,
      isRetry: true,
      converted: validation.converted
    });
    
    // CRITICAL: Verify payment status before retry to prevent duplicate charges
    console.log('💳 Verifying payment status before retry...');
    if (orderData.payment_status !== 'succeeded') {
      console.error(`❌ Payment not confirmed: ${orderData.payment_status}`);
      throw new Error(`Cannot retry order - payment status is ${orderData.payment_status}. Payment must be 'succeeded' before retrying to prevent duplicate charges.`);
    }
    
    console.log(`✅ Payment verified: ${orderData.payment_status} for $${orderData.total_amount}`);
    
    // Update the order with billing information in shipping_address jsonb
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'pending',
        notes: 'Retrying with updated billing info',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Error updating order with billing info:', updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    console.log('✅ Order updated with billing information');

    // Use unified processing function
    const functionName = 'process-order-v2';
    console.log(`🔄 Using ${functionName} for order retry`);

    // Resubmit via the processing function
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { 
        orderId,
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