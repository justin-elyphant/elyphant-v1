import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin permissions
    const { data: adminData, error: adminError } = await supabaseClient
      .from('business_admins')
      .select('can_manage_payment_methods')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminData?.can_manage_payment_methods) {
      console.error('Permission denied:', adminError);
      
      // Log unauthorized attempt
      await supabaseClient.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action_type: 'force_process_order_denied',
        target_type: 'order',
        target_id: user.id,
        action_details: {
          reason: 'insufficient_permissions',
          attempted_at: new Date().toISOString()
        }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient permissions. Requires can_manage_payment_methods permission.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚨 Force processing order: ${orderId} by admin: ${user.id}`);

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment is successful
    if (order.payment_status !== 'succeeded') {
      console.error('Payment not confirmed for order:', orderId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cannot force process - payment not confirmed' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order to bypass funding check
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        funding_status: 'funded',
        funding_allocated_at: new Date().toISOString(),
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update order status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log admin audit trail
    await supabaseClient.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action_type: 'force_process_order',
      target_type: 'order',
      target_id: orderId,
      action_details: {
        order_number: order.order_number,
        order_amount: order.total_amount,
        previous_funding_status: order.funding_status,
        forced_at: new Date().toISOString(),
        reason: 'VIP override - bypassed funding check'
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

    // Add order note
    await supabaseClient.from('order_notes').insert({
      order_id: orderId,
      admin_user_id: user.id,
      note_content: `🚨 Order force processed by admin (VIP override). Funding check bypassed.`,
      note_type: 'admin_action',
      is_internal: true
    });

    console.log(`✅ Order ${orderId} force processed successfully`);

    // Trigger the simple-order-processor to actually process the order
    const { data: processorData, error: processorError } = await supabaseClient.functions.invoke(
      'simple-order-processor',
      {
        body: { 
          orderId,
          bypassFundingCheck: true 
        }
      }
    );

    if (processorError) {
      console.error('Processor invocation failed:', processorError);
      // Don't fail - order is already marked as funded
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Order ${order.order_number} force processed successfully. Funding check bypassed.`,
        orderId,
        processorResult: processorData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Force process error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
