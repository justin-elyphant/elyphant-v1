import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { classifyZmaError } from '../shared/zmaErrorClassification.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZincOrderRequest {
  retailer: string;
  products: Array<{
    product_id: string;
    quantity: number;
  }>;
  shipping_address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
  billing_address?: any;
  payment_method?: any;
  gift_message?: string;
  max_price?: number;
  client_token?: string;
  gift?: boolean;
}

interface ZincApiResponse {
  _type: string;
  request_id: string;
  code?: string;
  message?: string;
  data?: any;
}

// Enhanced Zinc API wrapper with native retry/abort support
class ZincApiManager {
  private apiKey: string;
  private baseUrl = 'https://api.zinc.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getAuthHeaders() {
    return {
      'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
      'Content-Type': 'application/json',
    };
  }

  // Submit order to Zinc
  async submitOrder(orderRequest: ZincOrderRequest): Promise<ZincApiResponse> {
    console.log('🚀 [ZincAPI] Submitting order to Zinc...');
    
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderRequest),
      });

      const result = await response.json();
      console.log(`✅ [ZincAPI] Order submitted, request_id: ${result.request_id}`);
      return result;
    } catch (error) {
      console.error('❌ [ZincAPI] Order submission failed:', error);
      throw error;
    }
  }

  // Get order status from Zinc
  async getOrderStatus(requestId: string): Promise<ZincApiResponse> {
    console.log(`🔍 [ZincAPI] Getting order status for ${requestId}...`);
    
    try {
      const response = await fetch(`${this.baseUrl}/orders/${requestId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      console.log(`✅ [ZincAPI] Order status retrieved: ${result._type}`);
      return result;
    } catch (error) {
      console.error('❌ [ZincAPI] Order status check failed:', error);
      throw error;
    }
  }

  // Retry order using Zinc's native retry API
  async retryOrder(requestId: string): Promise<ZincApiResponse> {
    console.log(`🔄 [ZincAPI] Retrying order ${requestId} using Zinc native retry...`);
    
    try {
      const response = await fetch(`${this.baseUrl}/orders/${requestId}/retry`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      console.log(`✅ [ZincAPI] Order retry submitted, new request_id: ${result.request_id}`);
      return result;
    } catch (error) {
      console.error('❌ [ZincAPI] Order retry failed:', error);
      throw error;
    }
  }

  // Abort order using Zinc's native abort API
  async abortOrder(requestId: string): Promise<ZincApiResponse> {
    console.log(`🛑 [ZincAPI] Aborting order ${requestId} using Zinc native abort...`);
    
    try {
      const response = await fetch(`${this.baseUrl}/orders/${requestId}/abort`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      console.log(`✅ [ZincAPI] Order aborted successfully`);
      return result;
    } catch (error) {
      console.error('❌ [ZincAPI] Order abort failed:', error);
      throw error;
    }
  }
}

// Error classification now handled by shared utility

// Enhanced admin alerting system
async function sendAdminAlert(alertType: string, orderData: any, errorDetails: any, supabase: any) {
  console.log(`🚨 [ADMIN-ALERT] ${alertType}: ${errorDetails.adminMessage || errorDetails.userFriendlyMessage}`);
  
  try {
    // Insert admin alert record
    await supabase
      .from('admin_alerts')
      .insert({
        alert_type: alertType,
        severity: errorDetails.alertLevel,
        order_id: orderData.id,
        user_id: orderData.user_id,
        message: errorDetails.adminMessage || errorDetails.userFriendlyMessage,
        metadata: {
          error_code: errorDetails.code,
          error_message: errorDetails.message,
          order_amount: orderData.total_amount,
          retry_count: orderData.retry_count || 0,
          requires_intervention: errorDetails.requiresAdminIntervention || false
        },
        requires_action: errorDetails.requiresAdminIntervention || errorDetails.requiresInvestigation || false
      });

    // For critical alerts, also trigger immediate notification
    if (errorDetails.alertLevel === 'critical' || errorDetails.requiresAdminIntervention) {
      console.log('🚨 [CRITICAL-ALERT] Triggering immediate admin notification');
      
      // You would integrate with your notification system here
      // Example: Slack, email, SMS, etc.
    }
  } catch (alertError) {
    console.error('❌ Failed to send admin alert:', alertError);
  }
}

// Enhanced order cancellation with Zinc integration
async function cancelOrderWithZinc(orderId: string, cancellationReason: string, supabase: any) {
  console.log(`🛑 [CANCEL] Starting cancellation process for order ${orderId}`);
  
  try {
    // Get order details
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Check if order can be cancelled
    const { data: canCancel } = await supabase
      .rpc('can_cancel_order', { order_id: orderId });

    if (!canCancel) {
      throw new Error('Order cannot be cancelled in its current state');
    }

    let zincCancellationResult = null;

    // If order has zinc_order_id, attempt to cancel with Zinc
    if (orderData.zinc_order_id) {
      try {
        const { data: zmaAccount } = await supabase
          .from('zma_accounts')
          .select('api_key')
          .eq('is_active', true)
          .single();

        if (zmaAccount?.api_key) {
          const zincApi = new ZincApiManager(zmaAccount.api_key);
          zincCancellationResult = await zincApi.abortOrder(orderData.zinc_order_id);
          console.log('✅ [CANCEL] Zinc cancellation successful');
        }
      } catch (zincError) {
        console.warn('⚠️ [CANCEL] Zinc cancellation failed, proceeding with local cancellation:', zincError);
        // Continue with local cancellation even if Zinc fails
      }
    }

    // Update order status in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        zinc_status: 'cancelled',
        cancellation_reason: cancellationReason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // Add cancellation note
    await supabase
      .from('order_notes')
      .insert({
        order_id: orderId,
        admin_user_id: orderData.user_id,
        note_content: `Order cancelled by user: ${cancellationReason}`,
        note_type: 'cancellation',
        is_internal: false
      });

    // Handle refund if payment was processed
    if (orderData.payment_status === 'succeeded' && orderData.stripe_payment_intent_id) {
      console.log('💰 [CANCEL] Initiating refund process...');
      
      // Trigger refund process (would integrate with Stripe here)
      await supabase
        .from('refund_requests')
        .insert({
          order_id: orderId,
          amount: orderData.total_amount,
          reason: cancellationReason,
          status: 'pending',
          stripe_payment_intent_id: orderData.stripe_payment_intent_id
        });
    }

    console.log('✅ [CANCEL] Order cancellation completed successfully');
    
    return {
      success: true,
      message: 'Order cancelled successfully',
      zincCancellation: zincCancellationResult ? 'successful' : 'not_attempted',
      refundInitiated: orderData.payment_status === 'succeeded'
    };

  } catch (error) {
    console.error('❌ [CANCEL] Order cancellation failed:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 [ZINC-ORDER-MANAGEMENT] Enhanced order management with native Zinc APIs');

  try {
    const body = await req.json();
    const { action, orderId, retryStrategy, cancellationReason } = body;

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (action) {
      case 'retry_with_zinc':
        return await handleZincNativeRetry(orderId, supabase);
      
      case 'abort_order':
        return await handleZincAbort(orderId, supabase);
      
      case 'cancel_order':
        return await handleOrderCancellation(orderId, cancellationReason || 'User cancelled', supabase);
      
      case 'check_order_status':
        return await handleOrderStatusCheck(orderId, supabase);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('🚨 [ZINC-ORDER-MANAGEMENT] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// Handle Zinc native retry
async function handleZincNativeRetry(orderId: string, supabase: any) {
  console.log(`🔄 [ZINC-RETRY] Processing Zinc native retry for order ${orderId}`);
  
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !orderData) {
    throw new Error(`Order not found: ${orderError?.message}`);
  }

  if (!orderData.zinc_order_id) {
    throw new Error('Order has no Zinc request ID to retry');
  }

  // Get ZMA account
  const { data: zmaAccount } = await supabase
    .from('zma_accounts')
    .select('api_key')
    .eq('is_active', true)
    .single();

  if (!zmaAccount?.api_key) {
    throw new Error('No active ZMA account found');
  }

  const zincApi = new ZincApiManager(zmaAccount.api_key);
  const retryResult = await zincApi.retryOrder(orderData.zinc_order_id);

  // Update order with new request ID
  await supabase
    .from('orders')
    .update({
      zinc_order_id: retryResult.request_id,
      status: 'processing',
      zinc_status: 'processing',
      retry_count: (orderData.retry_count || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  return new Response(JSON.stringify({
    success: true,
    message: 'Order retried using Zinc native retry API',
    newRequestId: retryResult.request_id,
    retryCount: (orderData.retry_count || 0) + 1
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}

// Handle Zinc abort
async function handleZincAbort(orderId: string, supabase: any) {
  console.log(`🛑 [ZINC-ABORT] Processing Zinc abort for order ${orderId}`);
  
  const result = await cancelOrderWithZinc(orderId, 'Aborted via Zinc API', supabase);
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Order aborted successfully',
    ...result
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}

// Handle order cancellation
async function handleOrderCancellation(orderId: string, reason: string, supabase: any) {
  console.log(`🛑 [CANCEL] Processing cancellation for order ${orderId}`);
  
  const result = await cancelOrderWithZinc(orderId, reason, supabase);
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Order cancelled successfully',
    ...result
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}

// Handle order status check
async function handleOrderStatusCheck(orderId: string, supabase: any) {
  console.log(`🔍 [STATUS-CHECK] Checking status for order ${orderId}`);
  
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !orderData) {
    throw new Error(`Order not found: ${orderError?.message}`);
  }

  let zincStatus = null;
  
  if (orderData.zinc_order_id) {
    try {
      const { data: zmaAccount } = await supabase
        .from('zma_accounts')
        .select('api_key')
        .eq('is_active', true)
        .single();

      if (zmaAccount?.api_key) {
        const zincApi = new ZincApiManager(zmaAccount.api_key);
        zincStatus = await zincApi.getOrderStatus(orderData.zinc_order_id);
      }
    } catch (error) {
      console.warn('⚠️ [STATUS-CHECK] Zinc status check failed:', error);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    orderStatus: orderData.status,
    zincStatus: zincStatus,
    canCancel: ['pending', 'processing', 'failed'].includes(orderData.status),
    lastUpdated: orderData.updated_at
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}