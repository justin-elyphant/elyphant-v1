// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, currency = 'usd', metadata = {} } = await req.json()
    
    console.log('🔵 Creating payment intent:', {
      amount: amount,
      currency: currency,
      metadata: metadata,
      timestamp: new Date().toISOString()
    })

    // Create request fingerprint for deduplication
    const requestFingerprint = btoa(JSON.stringify({
      amount: Math.round(amount),
      cart_items: metadata.cart_items?.map((i: any) => ({ id: i.product_id, qty: i.quantity })),
      timestamp: new Date().setMinutes(new Date().getMinutes(), 0, 0) // Round to minute
    }));

    // Initialize Supabase client for deduplication check
    const authHeader = req.headers.get('Authorization');
    let user_id = null;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (user) {
          user_id = user.id;
          
          // Check for existing intent within last 5 minutes
          const { data: existingCache } = await supabase
            .from('payment_intents_cache')
            .select('stripe_payment_intent_id')
            .eq('user_id', user_id)
            .eq('request_fingerprint', requestFingerprint)
            .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
            .maybeSingle();

          if (existingCache) {
            console.log('🔄 Returning existing payment intent:', existingCache.stripe_payment_intent_id);
            const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
              Deno.env.get('STRIPE_SECRET_KEY') || '',
              { apiVersion: '2023-10-16' }
            );
            const existingIntent = await stripe.paymentIntents.retrieve(existingCache.stripe_payment_intent_id);
            
            return new Response(
              JSON.stringify({ 
                client_secret: existingIntent.client_secret,
                payment_intent_id: existingIntent.id,
                status: existingIntent.status,
                deduplicated: true
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              },
            );
          }
        }
      } catch (authError) {
        console.log('⚠️ Auth error during deduplication check:', authError);
      }
    }

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Get customer if authenticated
    let customer_id = null;
    if (authHeader && user_id) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (user?.email) {
          const customers = await stripe.customers.list({ 
            email: user.email,
            limit: 1 
          });
          
          if (customers.data.length > 0) {
            customer_id = customers.data[0].id;
            console.log('🔍 Found existing customer:', customer_id);
          } else {
            const customer = await stripe.customers.create({
              email: user.email,
              metadata: { user_id: user.id }
            });
            customer_id = customer.id;
            console.log('✨ Created new customer:', customer_id);
          }
        }
      } catch (authError) {
        console.log('⚠️ Auth error, proceeding without customer:', authError);
      }
    }

    let paymentIntentData: any = {
      amount: Math.round(amount),
      currency: currency,
      metadata: {
        ...metadata,
        created_source: 'create-payment-intent-function',
        created_at: new Date().toISOString(),
        // Add auto-gift identification for webhook reconciliation
        order_type: metadata.order_type || 'marketplace',
        execution_id: metadata.execution_id || metadata.auto_gift_execution_id || null,
        rule_id: metadata.rule_id || null,
      }
    };

    if (customer_id) {
      paymentIntentData.customer = customer_id;
    }

    const origin = req.headers.get('origin') || 'https://your-domain.com';
    const isScheduledDelivery = metadata.scheduledDeliveryDate && metadata.scheduledDeliveryDate !== '';
    
    console.log('🗓️ Scheduled delivery check:', {
      isScheduledDelivery,
      scheduledDate: metadata.scheduledDeliveryDate,
      shouldHoldPayment: isScheduledDelivery
    });
    
    const useExistingPaymentMethod = metadata.useExistingPaymentMethod;
    const paymentMethodId = metadata.paymentMethodId;

    if (useExistingPaymentMethod && paymentMethodId && customer_id) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        console.log('🔍 Retrieved payment method:', {
          id: paymentMethod.id,
          customer: paymentMethod.customer,
          type: paymentMethod.type
        });
        
        if (paymentMethod.customer && paymentMethod.customer !== customer_id) {
          console.log('⚠️ Payment method belongs to different customer, creating new payment intent for manual attachment');
          paymentIntentData.automatic_payment_methods = {
            enabled: true,
            allow_redirects: 'never',
          };
        } else {
          if (!paymentMethod.customer) {
            await stripe.paymentMethods.attach(paymentMethodId, {
              customer: customer_id,
            });
            console.log('🔗 Successfully attached payment method to customer');
          }
          
          if (isScheduledDelivery) {
            console.log('⏰ Scheduled delivery detected - creating payment intent WITHOUT immediate confirmation');
            paymentIntentData.payment_method = paymentMethodId;
            paymentIntentData.confirmation_method = 'manual';
            paymentIntentData.confirm = false;
            paymentIntentData.return_url = `${origin}/payment-success`;
          } else {
            console.log('⚡ Immediate delivery - confirming payment now');
            paymentIntentData.payment_method = paymentMethodId;
            paymentIntentData.confirmation_method = 'manual';
            paymentIntentData.confirm = true;
            paymentIntentData.return_url = `${origin}/payment-success`;
          }
        }
      } catch (attachError) {
        console.log('⚠️ Payment method attachment/retrieval error:', attachError);
        console.log('📋 Falling back to manual payment method selection');
        paymentIntentData.automatic_payment_methods = {
          enabled: true,
          allow_redirects: 'never',
        };
      }
    } else {
      paymentIntentData.automatic_payment_methods = {
        enabled: true,
        allow_redirects: 'never',
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    // Cache the payment intent for deduplication
    if (user_id) {
      try {
        await supabase
          .from('payment_intents_cache')
          .insert({
            user_id: user_id,
            request_fingerprint: requestFingerprint,
            stripe_payment_intent_id: paymentIntent.id,
            amount: Math.round(amount),
            metadata: metadata
          });
        console.log('💾 Cached payment intent for deduplication');
      } catch (cacheError) {
        console.log('⚠️ Failed to cache payment intent (non-critical):', cacheError);
      }
    }

    console.log('✅ Payment intent created successfully:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret ? 'present' : 'missing',
      payment_method: paymentIntent.payment_method || 'none'
    })

    return new Response(
      JSON.stringify({ 
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error creating payment intent:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})