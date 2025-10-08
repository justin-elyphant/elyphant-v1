import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_id, zip_code } = await req.json();
    console.log(`📦 Fetching shipping quote for product: ${product_id}, zip: ${zip_code}`);

    const zincApiKey = Deno.env.get('ZINC_API_KEY');
    if (!zincApiKey) {
      throw new Error('ZINC_API_KEY not configured');
    }

    // Call Zinc offers API
    const zincResponse = await fetch(`https://api.zinc.io/v1/products/${product_id}/offers?retailer=amazon`, {
      headers: {
        'Authorization': `Basic ${btoa(zincApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!zincResponse.ok) {
      throw new Error(`Zinc API error: ${zincResponse.status}`);
    }

    const zincData = await zincResponse.json();
    console.log(`✅ Got ${zincData.offers?.length || 0} offers from Zinc`);

    // Extract shipping options from offers
    const shippingOptions = [];
    
    if (zincData.offers && zincData.offers.length > 0) {
      for (const offer of zincData.offers) {
        if (offer.shipping) {
          for (const shippingOption of offer.shipping) {
            shippingOptions.push({
              method: shippingOption.method || (shippingOption.price === 0 ? 'Free Shipping' : 'Standard Shipping'),
              price: shippingOption.price || 0, // Already in cents
              delivery_days: shippingOption.delivery_days || null,
            });
          }
        }
      }
    }

    console.log(`📬 Returning ${shippingOptions.length} shipping options`);

    return new Response(
      JSON.stringify({ shipping_options: shippingOptions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Shipping quote error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
