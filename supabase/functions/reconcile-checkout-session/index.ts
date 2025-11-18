import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    console.log('🔧 Reconciling checkout session:', sessionId);

    if (!sessionId) {
      throw new Error('Missing sessionId');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Check if order already exists
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, order_number')
      .eq('checkout_session_id', sessionId)
      .single();

    if (existingOrder) {
      console.log('✅ Order already exists:', existingOrder.id);
      return new Response(
        JSON.stringify({ 
          success: true,
          order_id: existingOrder.id,
          order_number: existingOrder.order_number,
          message: 'Order already created'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch session from Stripe
    console.log('📋 Fetching session from Stripe...');
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16'
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    });

    console.log('Session status:', session.payment_status);

    if (session.payment_status !== 'paid') {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

    // Extract shipping from metadata (aligned with webhook)
    const metadata = session.metadata || {};
    const shippingAddress = {
      name: metadata.ship_name || '',
      address_line1: metadata.ship_address_line1 || '',
      address_line2: metadata.ship_address_line2 || '',
      city: metadata.ship_city || '',
      state: metadata.ship_state || '',
      postal_code: metadata.ship_postal_code || '',
      country: metadata.ship_country || 'US',
    };

    console.log(`📦 Reconcile: Shipping from metadata: ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code || '[MISSING]'}`);

    // Detect missing fields
    const missingFields = [
      !shippingAddress.address_line1 && 'address_line1',
      !shippingAddress.city && 'city',
      !shippingAddress.state && 'state',
      !shippingAddress.postal_code && 'postal_code'
    ].filter(Boolean);

    if (missingFields.length > 0) {
      console.warn(`⚠️ [WARN] Reconcile: creating order with incomplete shipping; missing: ${missingFields.join(', ')}`);
      console.log('[DEBUG] metadata keys:', Object.keys(metadata));
      // Mark as incomplete but continue (we'll create order with payment_confirmed status)
      (shippingAddress as any).validation_warning = `missing_${missingFields.join('_')}`;
    }

    const userId = metadata.user_id || session.client_reference_id;

    if (!userId) {
      throw new Error('No user_id found in session metadata or client_reference_id');
    }

    const isScheduled = metadata.scheduled_delivery_date && 
                        new Date(metadata.scheduled_delivery_date) > new Date();

    // Fetch line items
    const lineItemsResponse = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100
    });

    const lineItems = lineItemsResponse.data.map((item: any) => ({
      product_id: item.price?.product || item.description || 'unknown',
      title: item.description || 'Product',
      quantity: item.quantity || 1,
      unit_price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
      currency: item.price?.currency || 'usd',
    }));

    if (lineItems.length === 0) {
      throw new Error('No line items found');
    }

    console.log(`✅ Extracted ${lineItems.length} line items`);

    // Create order
    const orderData = {
      user_id: userId,
      checkout_session_id: sessionId,
      payment_intent_id: session.payment_intent as string || null,
      status: isScheduled ? 'scheduled' : 'payment_confirmed',
      payment_status: 'paid',
      total_amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || 'usd',
      line_items: lineItems,
      shipping_address: shippingAddress,
      is_scheduled: isScheduled,
      scheduled_delivery_date: metadata.scheduled_delivery_date || null,
      is_auto_gift: metadata.is_auto_gift === 'true',
      auto_gift_rule_id: metadata.auto_gift_rule_id || null,
      delivery_group_id: metadata.delivery_group_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Creating reconciled order...');
    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert(orderData)
      .select('id, order_number, status')
      .single();

    if (insertError) {
      console.error('❌ Failed to create order:', insertError);
      throw new Error(`Failed to create order: ${insertError.message}`);
    }

    console.log(`✅ Order reconciled: ${newOrder.id} | ${newOrder.order_number}`);

    // Send receipt email
    try {
      await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: { orderId: newOrder.id }
      });
      console.log('📧 Email orchestrator triggered');
    } catch (emailErr) {
      console.error('⚠️ Email send failed (non-critical):', emailErr);
    }

    // Trigger processing if not scheduled
    if (!isScheduled) {
      try {
        await supabase.functions.invoke('process-order-v2', {
          body: { orderId: newOrder.id }
        });
        console.log('🚀 Process-order-v2 triggered');
      } catch (processErr) {
        console.error('⚠️ Processing trigger failed (will be picked up by monitor):', processErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        order_id: newOrder.id,
        order_number: newOrder.order_number,
        status: newOrder.status,
        message: 'Order successfully reconciled'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Reconciliation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
