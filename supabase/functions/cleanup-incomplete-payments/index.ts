// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting cleanup of incomplete Stripe payment intents...');
    
    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    // Get incomplete payment intents from the last 7 days
    const oneWeekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    
    const paymentIntents = await stripe.paymentIntents.list({
      created: { gte: oneWeekAgo },
      limit: 100
    });

    let canceledCount = 0;
    let totalFound = 0;

    for (const paymentIntent of paymentIntents.data) {
      totalFound++;
      
      // Check if it's incomplete and looks like it might be from auto-gifts
      const isIncomplete = paymentIntent.status === 'requires_payment_method' || 
                          paymentIntent.status === 'requires_confirmation';
      
      const isAutoGiftRelated = paymentIntent.metadata?.order_type === 'auto_gift' ||
                               paymentIntent.description?.includes('auto') ||
                               paymentIntent.id.includes('pi_test_') ||
                               paymentIntent.amount === 2430; // The $24.30 mentioned

      if (isIncomplete && isAutoGiftRelated) {
        try {
          await stripe.paymentIntents.cancel(paymentIntent.id);
          canceledCount++;
          console.log(`✅ Canceled incomplete payment intent: ${paymentIntent.id} (${paymentIntent.amount/100} ${paymentIntent.currency})`);
        } catch (cancelError) {
          console.log(`⚠️ Could not cancel ${paymentIntent.id}: ${cancelError.message}`);
        }
      }
    }

    console.log(`🎯 Cleanup complete: Found ${totalFound} payment intents, canceled ${canceledCount} incomplete auto-gift related ones`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Cleanup complete: Found ${totalFound} payment intents, canceled ${canceledCount} incomplete auto-gift related ones`,
        totalFound,
        canceledCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error during payment cleanup:', error);
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