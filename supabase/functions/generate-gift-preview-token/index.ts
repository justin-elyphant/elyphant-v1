import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, recipientEmail } = await req.json();

    if (!orderId || !recipientEmail) {
      throw new Error('Missing required fields: orderId and recipientEmail');
    }

    console.log(`🎁 Generating preview token for order ${orderId}, recipient: ${recipientEmail}`);

    // Generate secure random token (64 characters for high security)
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');

    // Insert token into database
    const { data: tokenData, error } = await supabaseAdmin
      .from('gift_preview_tokens')
      .insert({
        order_id: orderId,
        token,
        recipient_email: recipientEmail
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating token:', error);
      throw error;
    }

    console.log(`✅ Preview token generated successfully: ${token.substring(0, 10)}...`);

    const baseUrl = 'https://elyphant.ai';
    
    return new Response(
      JSON.stringify({ 
        success: true,
        token,
        previewUrl: `${baseUrl}/gifts/preview/${token}`,
        thankYouUrl: `${baseUrl}/gifts/preview/${token}?action=thankyou`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error in generate-gift-preview-token:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
