import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Processing pending auto-gift executions for user ${userId}`);
    
    // First check for stuck executions for this user (reset processing to pending)
    console.log('🔄 Resetting stuck processing executions...');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { error: resetError } = await supabase
      .from('automated_gift_executions')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'processing')
      .lt('updated_at', thirtyMinutesAgo);

    if (resetError) {
      console.error('❌ Error resetting stuck executions:', resetError);
    }

    // Get all pending executions for this user
    const { data: executions, error } = await supabase
      .from('automated_gift_executions')
      .select(`
        *,
        auto_gifting_rules (*),
        user_special_dates (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('❌ Error fetching pending executions:', error);
      throw error;
    }

    console.log(`📊 Found ${executions?.length || 0} pending executions to process`);

    // Process each execution using the existing UnifiedGiftAutomationService logic
    for (const execution of executions || []) {
      try {
        console.log(`📦 Processing execution ${execution.id}`);
        
        // Mark as processing
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', execution.id);

        // Validate execution has required data
        if (!execution.auto_gifting_rules) {
          console.error(`❌ Missing rule data for execution ${execution.id}`);
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'failed',
              error_message: 'Auto-gifting rule no longer exists or is invalid',
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
          continue;
        }

        const rule = execution.auto_gifting_rules;
        
        // Call the existing unified-gift-automation function which contains the core logic
        const { data: result, error: processError } = await supabase.functions.invoke('unified-gift-automation', {
          body: {
            action: 'process_execution',
            executionId: execution.id,
            userId: execution.user_id,
            recipientId: rule.recipient_id,
            budget: rule.budget_limit,
            occasion: rule.date_type,
            preferences: rule.gift_preferences
          }
        });

        if (processError) {
          console.error(`❌ Error processing execution ${execution.id}:`, processError);
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'failed',
              error_message: `Processing failed: ${processError.message}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
        } else {
          console.log(`✅ Successfully processed execution ${execution.id}`);
          
          // Create notification for user
          await supabase
            .from('auto_gift_notifications')
            .insert({
              user_id: userId,
              notification_type: 'gift_suggestions_ready',
              title: 'Gift Suggestions Ready',
              message: result?.message || 'New gift suggestions are ready for your review',
              execution_id: execution.id
            });
        }

      } catch (executionError) {
        console.error(`❌ Error processing execution ${execution.id}:`, executionError);
        
        // Mark execution as failed
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'failed',
            error_message: `Unexpected error: ${executionError.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', execution.id);
      }
    }

    const processedCount = executions?.length || 0;
    console.log(`✅ Completed processing ${processedCount} executions for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedCount} auto-gift executions`,
        processedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in process-auto-gifts function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});