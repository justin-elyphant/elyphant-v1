import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  signature: string;
  body: string;
  source: 'stripe' | 'zinc';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signature, body, source }: ValidationRequest = await req.json();

    console.log(`🔐 Validating ${source} webhook signature...`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Rate limiting check
    const rateLimitKey = `webhook_${source}_${signature.substring(0, 10)}`;
    const { data: rateLimitData } = await supabase
      .from('webhook_rate_limits')
      .select('count, last_request')
      .eq('key', rateLimitKey)
      .maybeSingle();

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    if (rateLimitData) {
      const lastRequest = new Date(rateLimitData.last_request).getTime();
      
      if (lastRequest > oneMinuteAgo && rateLimitData.count >= 10) {
        console.warn('⚠️ Webhook rate limit exceeded');
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Rate limit exceeded',
            retry_after: 60 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          }
        );
      }

      // Update rate limit counter
      await supabase
        .from('webhook_rate_limits')
        .update({
          count: lastRequest > oneMinuteAgo ? rateLimitData.count + 1 : 1,
          last_request: new Date().toISOString(),
        })
        .eq('key', rateLimitKey);
    } else {
      // Create new rate limit entry
      await supabase
        .from('webhook_rate_limits')
        .insert({
          key: rateLimitKey,
          count: 1,
          last_request: new Date().toISOString(),
        });
    }

    // Validate signature based on source
    let isValid = false;

    if (source === 'stripe') {
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
        Deno.env.get('STRIPE_SECRET_KEY') || '',
        { apiVersion: '2023-10-16' }
      );

      try {
        const event = await stripe.webhooks.constructEventAsync(
          body,
          signature,
          webhookSecret
        );
        isValid = !!event;
      } catch (err) {
        console.error('❌ Stripe signature validation failed:', err);
        isValid = false;
      }
    } 
    else if (source === 'zinc') {
      // Zinc uses a different validation method
      const zincSecret = Deno.env.get('ZINC_WEBHOOK_SECRET');
      if (!zincSecret) {
        throw new Error('Zinc webhook secret not configured');
      }

      // Zinc typically uses HMAC SHA256
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(zincSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(body)
      );

      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      isValid = expectedSignature === signature;
    }

    console.log(`${isValid ? '✅' : '❌'} Signature validation ${isValid ? 'passed' : 'failed'}`);

    return new Response(
      JSON.stringify({ 
        valid: isValid,
        source,
        timestamp: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: isValid ? 200 : 401,
      }
    );
  } catch (error: any) {
    console.error('❌ Webhook validation error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
