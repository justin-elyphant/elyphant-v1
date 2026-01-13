import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎁 Processing auto-gift approval...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const body = await req.json();
    const { 
      token,           // Token-based approval (from email links)
      executionId,     // Direct execution ID (from dashboard)
      action,          // 'approve' | 'reject'
      selectedProductIds,
      approvalDecision, // Alternative to action: 'approved' | 'rejected'
      rejectionReason
    } = body;

    console.log('📊 Approval request:', { token, executionId, action, approvalDecision, selectedProductIds });

    // Normalize the action
    const finalAction = action || (approvalDecision === 'rejected' ? 'reject' : 'approve');

    let execution: any = null;
    let tokenRecord: any = null;
    let userId: string = '';

    // ===========================================
    // FLOW 1: Token-based approval (from email)
    // ===========================================
    if (token) {
      console.log('🔑 Token-based approval flow...');
      
      // Look up the token
      const { data: tokenData, error: tokenError } = await supabase
        .from('email_approval_tokens')
        .select(`
          *,
          automated_gift_executions (*)
        `)
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        console.error('❌ Invalid token:', tokenError);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired approval token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      tokenRecord = tokenData;
      execution = tokenData.automated_gift_executions;
      userId = tokenData.user_id;

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        console.error('❌ Token expired');
        return new Response(
          JSON.stringify({ success: false, error: 'Approval token has expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check if already processed
      if (tokenData.approved_at || tokenData.rejected_at) {
        console.log('ℹ️ Token already processed');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'This approval has already been processed',
            alreadyProcessed: true,
            wasApproved: !!tokenData.approved_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // ===========================================
    // FLOW 2: Execution ID-based approval (dashboard)
    // ===========================================
    if (executionId && !token) {
      console.log('📋 Execution ID-based approval flow...');
      
      const { data: executionData, error: execError } = await supabase
        .from('automated_gift_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (execError || !executionData) {
        console.error('❌ Invalid execution ID:', execError);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid execution ID' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      execution = executionData;
      userId = executionData.user_id;

      // Also check for existing token
      const { data: existingToken } = await supabase
        .from('email_approval_tokens')
        .select('*')
        .eq('execution_id', executionId)
        .maybeSingle();

      tokenRecord = existingToken;
    }

    if (!execution) {
      console.error('❌ No execution found');
      return new Response(
        JSON.stringify({ success: false, error: 'No execution found to approve' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`📦 Processing execution ${execution.id}, action: ${finalAction}`);

    // ===========================================
    // HANDLE REJECTION
    // ===========================================
    if (finalAction === 'reject') {
      console.log('❌ Processing rejection...');

      // Update execution status
      await supabase
        .from('automated_gift_executions')
        .update({
          status: 'rejected',
          error_message: rejectionReason || 'User rejected the gift selection',
          updated_at: new Date().toISOString(),
        })
        .eq('id', execution.id);

      // Update token if exists
      if (tokenRecord) {
        await supabase
          .from('email_approval_tokens')
          .update({
            rejected_at: new Date().toISOString(),
            rejection_reason: rejectionReason || 'User rejected the gift selection',
            updated_at: new Date().toISOString(),
          })
          .eq('id', tokenRecord.id);
      }

      // Create notification
      await supabase.from('auto_gift_notifications').insert({
        user_id: userId,
        execution_id: execution.id,
        notification_type: 'auto_gift_rejected',
        title: 'Auto-gift rejected',
        message: rejectionReason || 'You rejected the auto-gift selection',
        is_read: false,
        email_sent: false,
      });

      console.log('✅ Rejection processed successfully');
      return new Response(
        JSON.stringify({ success: true, action: 'rejected', executionId: execution.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ===========================================
    // HANDLE APPROVAL
    // ===========================================
    console.log('✅ Processing approval...');

    // Get the products to order
    const products = Array.isArray(execution.selected_products) ? execution.selected_products : [];
    
    // Filter by selected product IDs if provided
    const productsToOrder = selectedProductIds && selectedProductIds.length > 0
      ? products.filter((p: any) => selectedProductIds.includes(p.product_id))
      : products;

    if (productsToOrder.length === 0) {
      console.error('❌ No products to order');
      return new Response(
        JSON.stringify({ success: false, error: 'No products selected for ordering' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the auto-gift rule for additional context
    const { data: rule } = await supabase
      .from('auto_gifting_rules')
      .select('*, recipient:profiles!auto_gifting_rules_recipient_id_fkey(*)')
      .eq('id', execution.rule_id)
      .single();

    const recipientName = rule?.recipient?.name || rule?.recipient?.email || 'Recipient';
    const recipientEmail = rule?.recipient?.email;

    // Get recipient's shipping address
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('shipping_address, email')
      .eq('id', rule?.recipient_id)
      .single();

    // Calculate total
    const totalAmount = productsToOrder.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

    console.log(`💳 Creating checkout session for ${productsToOrder.length} products, total: $${totalAmount}`);

    // Create checkout session via the existing function
    const cartItems = productsToOrder.map((p: any) => ({
      product_id: p.product_id,
      product_name: p.name || p.title || 'Gift Item',
      quantity: 1,
      price: p.price,
      image_url: p.image_url || p.image,
    }));

    const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
      'create-checkout-session',
      {
        body: {
          cartItems,
          deliveryGroups: [{
            recipient: {
              name: recipientName,
              email: recipientEmail || recipientProfile?.email,
              address: recipientProfile?.shipping_address,
            },
            items: cartItems.map((item: any) => ({
              product_id: item.product_id,
              quantity: 1,
            })),
          }],
          scheduledDeliveryDate: execution.execution_date,
          isAutoGift: true,
          autoGiftRuleId: execution.rule_id,
          giftOptions: {
            message: rule?.gift_message || `Happy ${rule?.date_type?.replace(/_/g, ' ')}!`,
            isGift: true,
            giftWrap: true,
          },
          pricingBreakdown: {
            subtotal: totalAmount,
            shippingCost: 0,
            giftingFee: 0,
            taxAmount: 0,
            total: totalAmount,
          },
          metadata: {
            user_id: userId,
            is_auto_gift: 'true',
            auto_gift_rule_id: execution.rule_id,
            auto_gift_execution_id: execution.id,
            occasion: rule?.date_type,
            recipient_name: recipientName,
            approved_via: token ? 'email' : 'dashboard',
          },
        },
      }
    );

    if (checkoutError) {
      console.error('❌ Checkout session creation failed:', checkoutError);
      throw new Error(`Failed to create checkout session: ${checkoutError.message}`);
    }

    console.log('✅ Checkout session created:', checkoutData);

    // Update execution status
    await supabase
      .from('automated_gift_executions')
      .update({
        status: 'approved',
        total_amount: totalAmount,
        selected_products: productsToOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    // Update token if exists
    if (tokenRecord) {
      await supabase
        .from('email_approval_tokens')
        .update({
          approved_at: new Date().toISOString(),
          approved_via: token ? 'email_link' : 'dashboard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokenRecord.id);
    }

    // Create success notification
    await supabase.from('auto_gift_notifications').insert({
      user_id: userId,
      execution_id: execution.id,
      notification_type: 'auto_gift_approved',
      title: 'Auto-gift approved!',
      message: `Your auto-gift for ${recipientName} has been approved. Total: $${totalAmount.toFixed(2)}`,
      is_read: false,
      email_sent: false,
    });

    // Log the event
    await supabase.from('auto_gift_event_logs').insert({
      user_id: userId,
      rule_id: execution.rule_id,
      execution_id: execution.id,
      event_type: 'approval_completed',
      event_data: {
        action: 'approved',
        approved_via: token ? 'email_link' : 'dashboard',
        products_count: productsToOrder.length,
        total_amount: totalAmount,
        checkout_session_id: checkoutData?.sessionId,
      },
      metadata: {
        token_id: tokenRecord?.id,
      },
    });

    console.log('✅ Auto-gift approval completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: 'approved',
        executionId: execution.id,
        checkoutUrl: checkoutData?.url,
        sessionId: checkoutData?.sessionId,
        totalAmount,
        productsCount: productsToOrder.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Auto-gift approval error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
