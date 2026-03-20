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

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '30');

    // Fetch recent payouts
    const payouts = await stripe.payouts.list({
      limit: Math.min(limit, 100),
    });

    const payoutData = payouts.data.map(p => ({
      id: p.id,
      amount: p.amount / 100, // Stripe stores in cents
      currency: p.currency,
      status: p.status,
      arrival_date: new Date(p.arrival_date * 1000).toISOString(),
      created: new Date(p.created * 1000).toISOString(),
      description: p.description,
      method: p.method,
    }));

    console.log(`💰 Fetched ${payoutData.length} Stripe payouts`);

    return new Response(
      JSON.stringify({ payouts: payoutData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ get-stripe-payouts error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
