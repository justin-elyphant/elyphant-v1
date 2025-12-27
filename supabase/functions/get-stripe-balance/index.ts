import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get current Stripe balance
    const balance = await stripe.balance.retrieve();

    // Extract USD balances (amounts are in cents)
    const availableUSD = balance.available.find(b => b.currency === 'usd')?.amount || 0;
    const pendingUSD = balance.pending.find(b => b.currency === 'usd')?.amount || 0;

    console.log(`💰 Stripe Balance: Available $${(availableUSD / 100).toFixed(2)}, Pending $${(pendingUSD / 100).toFixed(2)}`);

    return new Response(
      JSON.stringify({
        available: availableUSD / 100,
        pending: pendingUSD / 100,
        currency: 'usd',
        retrieved_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ get-stripe-balance error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
