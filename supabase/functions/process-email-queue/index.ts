import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📧 Processing email queue...');

    // Get pending emails that are ready to be sent
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(50); // Process up to 50 emails at a time

    if (fetchError) {
      console.error('❌ Failed to fetch pending emails:', fetchError);
      throw fetchError;
    }

    console.log(`📬 Found ${pendingEmails?.length || 0} emails to process`);

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No emails to process',
          processed: 0 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each email
    for (const email of pendingEmails) {
      try {
        // Get event_type from either the new email_queue.event_type column or legacy template_variables
        const eventType = email.event_type || email.template_variables?.eventType;
        console.log(`📧 Processing ${eventType || 'unknown'} email for ${email.recipient_email}`);

        // Route to appropriate handler based on event type
        if (!eventType) {
          // Legacy: Check for welcome wishlist data (backward compatibility)
          const welcomeWishlistData = email.template_variables?.welcomeWishlistData;
          
          if (welcomeWishlistData) {
            const { error: welcomeError } = await supabase.functions.invoke('send-welcome-wishlist', {
              body: welcomeWishlistData
            });
            if (welcomeError) throw welcomeError;
          } else {
            console.log('⚠️ No eventType specified, skipping:', email.id);
            continue;
          }
        } else {
          // Route all modern emails to ecommerce orchestrator
          // Merge metadata and template_variables for backward compatibility
          const emailData = email.metadata || email.template_variables?.customData || {};
          
          const { error: orchestratorError } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
            body: {
              eventType: eventType,
              recipientEmail: email.recipient_email,
              data: emailData
            }
          });

          if (orchestratorError) {
            throw orchestratorError;
          }
        }

        // Mark email as sent
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        processedCount++;
        console.log(`✅ Successfully processed email ${email.id}`);

      } catch (emailError: any) {
        console.error(`❌ Failed to process email ${email.id}:`, emailError);
        
        // Update attempt count and error message
        const newAttempts = email.attempts + 1;
        const status = newAttempts >= email.max_attempts ? 'failed' : 'pending';
        
        await supabase
          .from('email_queue')
          .update({
            attempts: newAttempts,
            status: status,
            error_message: emailError.message || 'Unknown error',
            updated_at: new Date().toISOString(),
            // Retry in 1 hour if not max attempts reached
            scheduled_for: status === 'pending' 
              ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
              : email.scheduled_for
          })
          .eq('id', email.id);

        errorCount++;
      }
    }

    console.log(`🎯 Email processing complete: ${processedCount} sent, ${errorCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email queue processed',
        processed: processedCount,
        errors: errorCount,
        total: pendingEmails.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Email queue processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process email queue'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);