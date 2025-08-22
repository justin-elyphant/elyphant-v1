
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Check if we should use an existing payment method
    const useExistingPaymentMethod = metadata.useExistingPaymentMethod;
    const paymentMethodId = metadata.paymentMethodId;

    // Get the user's email from the request to find or create Stripe customer
    const authHeader = req.headers.get('Authorization');
    let customer_id = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await (await import('https://esm.sh/@supabase/supabase-js@2.45.0')).createClient(
          Deno.env.get('SUPABASE_URL') || '',
          Deno.env.get('SUPABASE_ANON_KEY') || ''
        ).auth.getUser(token);
        
        if (user?.email) {
          // Find or create Stripe customer
          const customers = await stripe.customers.list({ 
            email: user.email,
            limit: 1 
          });
          
          if (customers.data.length > 0) {
            customer_id = customers.data[0].id;
            console.log('🔍 Found existing customer:', customer_id);
          } else {
            // Create new customer
            const customer = await stripe.customers.create({
              email: user.email,
              metadata: {
                user_id: user.id
              }
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
        created_at: new Date().toISOString()
      }
    };

    // Add customer if we have one
    if (customer_id) {
      paymentIntentData.customer = customer_id;
    }

    // Get origin for return URL
    const origin = req.headers.get('origin') || 'https://your-domain.com';
    
    if (useExistingPaymentMethod && paymentMethodId && customer_id) {
      // First, attach the payment method to the customer if not already attached
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (!paymentMethod.customer) {
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer_id,
          });
          console.log('🔗 Attached payment method to customer');
        }
      } catch (attachError) {
        console.log('⚠️ Payment method attachment error:', attachError);
        // Continue with payment intent creation even if attachment fails
      }
      
      // Use existing payment method with confirmation
      paymentIntentData.payment_method = paymentMethodId;
      paymentIntentData.confirmation_method = 'manual';
      paymentIntentData.confirm = true;
      paymentIntentData.return_url = `${origin}/payment-success`;
    } else {
      // Allow new payment method without return_url (we'll handle redirect in frontend)
      paymentIntentData.automatic_payment_methods = {
        enabled: true,
        allow_redirects: 'never',
      };
      // Do not set return_url when confirm is not true
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

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
