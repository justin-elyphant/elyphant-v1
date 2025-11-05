import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartSession {
  id: string;
  session_id: string;
  user_id: string | null;
  cart_data: {
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      price: number;
      image_url?: string;
      images?: string[];
      recipient_id?: string;
    }>;
  };
  total_amount: number;
  last_updated: string;
  checkout_initiated_at: string | null;
  recovery_emails_sent?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting abandoned cart detection...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find abandoned carts:
    // - Not completed (completed_at IS NULL)
    // - Last updated > 1 hour ago
    // - No recovery email sent yet OR last sent > 24 hours ago
    // - Max 3 recovery emails per cart
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: abandonedCarts, error: fetchError } = await supabase
      .from('cart_sessions')
      .select('*')
      .is('completed_at', null)
      .lt('last_updated', oneHourAgo)
      .lt('recovery_emails_sent', 3)
      .or(`last_recovery_email_sent.is.null,last_recovery_email_sent.lt.${twentyFourHoursAgo}`);

    if (fetchError) {
      console.error('❌ Error fetching abandoned carts:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${abandonedCarts?.length || 0} abandoned carts`);

    if (!abandonedCarts || abandonedCarts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No abandoned carts found',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const cart of abandonedCarts as CartSession[]) {
      try {
        // Get user email if user_id exists
        let userEmail = null;
        let firstName = 'there';

        if (cart.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, first_name')
            .eq('id', cart.user_id)
            .single();

          if (profile) {
            userEmail = profile.email;
            firstName = profile.first_name || 'there';
          }
        }

        // Skip if no email available
        if (!userEmail) {
          console.log(`⚠️ Skipping cart ${cart.session_id} - no user email`);
          continue;
        }

        // Prepare cart items for email with real product images
        const cartItems = cart.cart_data.items.map(item => ({
          title: item.product_name,
          price: `$${item.price.toFixed(2)}`,
          image_url: item.image_url || item.images?.[0] || 'https://dmkxtkvlispxeqfzlczr.supabase.co/storage/v1/object/public/product-images/placeholder.jpg'
        }));
        
        // Determine email sequence number for differentiated messaging
        const emailSequence = (cart.recovery_emails_sent || 0) + 1;

        // Get the cart_abandoned template ID
        const { data: template } = await supabase
          .from('email_templates')
          .select('id')
          .eq('template_type', 'cart_abandoned')
          .eq('is_active', true)
          .single();

        if (!template) {
          console.error(`❌ No active cart_abandoned template found`);
          failed++;
          continue;
        }

        // Queue abandoned cart email with sequence info for differentiated messaging
        const { error: emailError } = await supabase
          .from('email_queue')
          .insert({
            template_id: template.id,
            recipient_email: userEmail,
            recipient_name: firstName,
            template_variables: {
              eventType: 'cart_abandoned',
              first_name: firstName,
              cart_items: cartItems,
              cart_total: `$${cart.total_amount.toFixed(2)}`,
              cart_url: `https://dmkxtkvlispxeqfzlczr.supabase.co/cart?recover=${cart.session_id}`,
              email_sequence: emailSequence, // 1, 2, or 3 for differentiated messaging
              is_first_reminder: emailSequence === 1,
              is_final_reminder: emailSequence === 3
            },
            scheduled_for: new Date().toISOString()
          });

        if (emailError) {
          console.error(`❌ Failed to queue email for cart ${cart.session_id}:`, emailError);
          failed++;
          continue;
        }

        // Update cart session - mark as abandoned and increment email count
        const { error: updateError } = await supabase
          .from('cart_sessions')
          .update({
            abandoned_at: new Date().toISOString(),
            last_recovery_email_sent: new Date().toISOString(),
            recovery_emails_sent: (cart.recovery_emails_sent || 0) + 1
          })
          .eq('id', cart.id);

        if (updateError) {
          console.error(`❌ Failed to update cart ${cart.session_id}:`, updateError);
          failed++;
          continue;
        }

        console.log(`✅ Queued abandoned cart email for ${userEmail} (cart: ${cart.session_id})`);
        processed++;

      } catch (error) {
        console.error(`❌ Error processing cart ${cart.session_id}:`, error);
        failed++;
      }
    }

    console.log(`✅ Abandoned cart detection complete: ${processed} processed, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${processed} abandoned carts`,
        processed,
        failed,
        total: abandonedCarts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Abandoned cart detection failed:', error);
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
