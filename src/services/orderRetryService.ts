/**
 * Order Retry Service - Handles retrying failed orders with corrected information
 * 
 * This service allows retrying stuck orders by updating them with proper
 * billing information and resubmitting to Zinc.
 */

import { supabase } from "@/integrations/supabase/client";
import { BillingInfo } from "./billingService";

export interface OrderRetryResult {
  success: boolean;
  message: string;
  zincOrderId?: string;
  error?: string;
}

/**
 * Retries a failed order by updating it with billing information and resubmitting to Zinc
 */
export const retryOrderWithBillingInfo = async (
  orderId: string, 
  billingInfo: BillingInfo,
  testMode = false
): Promise<OrderRetryResult> => {
  try {
    console.log(`🔄 Retrying order ${orderId} with billing info:`, billingInfo);
    
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

    // Resubmit to Zinc via the process-zinc-order function
    const { data, error } = await supabase.functions.invoke('process-zinc-order', {
      body: { 
        orderId, 
        isTestMode: testMode,
        debugMode: true 
      }
    });

    if (error) {
      console.error('❌ Error invoking process-zinc-order:', error);
      throw new Error(`Failed to resubmit order: ${error.message}`);
    }

    if (data.success) {
      console.log('✅ Order retry successful:', data);
      
      // Log the successful retry
      await supabase
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_content: `Order successfully retried with billing info. Cardholder: ${billingInfo.cardholderName}. Zinc Order ID: ${data.zincOrderId}`,
          note_type: 'retry',
          is_internal: false
        });

      return {
        success: true,
        message: 'Order successfully retried and resubmitted to Zinc',
        zincOrderId: data.zincOrderId
      };
    } else {
      throw new Error(data.error || 'Unknown error during order retry');
    }

  } catch (error) {
    console.error('🚨 Order retry failed:', error);
    
    // Log the failed retry
    try {
      await supabase
        .from('order_notes')
        .insert({
          order_id: orderId,
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