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

    // Check for existing executions to prevent duplicates
    console.log('🔍 Checking for existing executions to prevent duplicates...');
    const { data: existingExecutions, error: existingError } = await supabase
      .from('automated_gift_executions')
      .select('id, rule_id, event_id, execution_date, status')
      .eq('user_id', userId)
      .gte('execution_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 24 hours

    if (existingError) {
      console.error('❌ Error checking existing executions:', existingError);
    } else {
      console.log(`📊 Found ${existingExecutions?.length || 0} existing executions in last 24 hours`);
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
        
        // Check for duplicate execution (prevent multiple executions for same rule/event/date)
        const duplicateKey = `${execution.rule_id}-${execution.event_id || 'no-event'}-${execution.execution_date}`;
        const existingDuplicate = existingExecutions?.find(e => 
          e.rule_id === execution.rule_id && 
          e.event_id === execution.event_id && 
          e.execution_date === execution.execution_date &&
          e.id !== execution.id &&
          ['processing', 'pending_approval', 'approved', 'completed'].includes(e.status)
        );

        if (existingDuplicate) {
          console.log(`⚠️ Duplicate execution detected for ${duplicateKey}, skipping execution ${execution.id}`);
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'cancelled',
              error_message: `Duplicate execution - another execution exists for this rule/event/date (ID: ${existingDuplicate.id})`,
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
          continue;
        }
        
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
        
        // Core gift automation logic integrated directly here
        console.log(`🎁 Processing gift for recipient ${rule.recipient_id}, budget: ${rule.budget_limit}, occasion: ${rule.date_type}`);
        
        try {
          // Get recipient profile and wishlist
          const { data: recipientProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', rule.recipient_id)
            .single();

          if (profileError || !recipientProfile) {
            throw new Error(`Failed to fetch recipient profile: ${profileError?.message}`);
          }

          // Get recipient's wishlists (should work with updated RLS policy)
          const { data: wishlists, error: wishlistError } = await supabase
            .from('wishlists')
            .select(`
              *,
              wishlist_items (
                *
              )
            `)
            .eq('user_id', rule.recipient_id);

          if (wishlistError) {
            console.error(`❌ Error fetching wishlists:`, wishlistError);
            throw new Error(`Failed to fetch recipient wishlists: ${wishlistError.message}`);
          }

          console.log(`📋 Found ${wishlists?.length || 0} wishlists for recipient`);
          
          // Collect all wishlist items within budget
          const allWishlistItems = [];
          for (const wishlist of wishlists || []) {
            for (const item of wishlist.wishlist_items || []) {
              if (item.price && item.price <= (rule.budget_limit || 50)) {
                allWishlistItems.push({
                  ...item,
                  wishlist_title: wishlist.title
                });
              }
            }
          }

          console.log(`🛍️ Found ${allWishlistItems.length} wishlist items within budget`);

          let selectedProducts = [];
          
          if (allWishlistItems.length > 0) {
            // Sort by price to find best budget combination
            allWishlistItems.sort((a, b) => (b.price || 0) - (a.price || 0));
            
            // Simple budget optimization: try to get close to budget limit
            let totalCost = 0;
            const budgetLimit = rule.budget_limit || 50;
            
            for (const item of allWishlistItems) {
              if (totalCost + (item.price || 0) <= budgetLimit) {
                selectedProducts.push({
                  id: item.id,
                  product_id: item.product_id || item.id,
                  title: item.product_name,
                  product_name: item.product_name,
                  name: item.product_name, // Additional alias
                  price: item.price,
                  image: item.image_url,
                  image_url: item.image_url,
                  source: 'wishlist',
                  vendor: 'Wishlist',
                  category: item.category,
                  brand: item.brand,
                  wishlist_title: item.wishlist_title,
                  description: item.description || `From ${item.wishlist_title || 'wishlist'}`,
                  product_details: item.product_details,
                  features: item.features
                });
                totalCost += item.price || 0;
                
                // Stop if we're at or very close to budget
                if (totalCost >= budgetLimit * 0.85) break;
              }
            }
            
            console.log(`💰 Selected ${selectedProducts.length} products totaling $${totalCost.toFixed(2)} (${Math.round(totalCost/budgetLimit*100)}% of $${budgetLimit} budget)`);
          } else {
            console.log(`📝 No wishlist items found, will need AI recommendations`);
            // For now, just create a placeholder recommendation
            selectedProducts = [{
              id: `ai-${Date.now()}`,
              product_id: `ai-${Date.now()}`,
              title: `AI Recommended Gift for ${rule.date_type}`,
              product_name: `AI Recommended Gift for ${rule.date_type}`,
              name: `AI Recommended Gift for ${rule.date_type}`,
              price: Math.min(rule.budget_limit || 50, 25),
              image: null,
              image_url: null,
              source: 'ai_recommendation',
              vendor: 'AI Recommendation',
              category: rule.date_type,
              description: `AI-generated gift suggestion for ${rule.date_type} occasion`
            }];
          }

          // Check auto-approve setting
          const { data: settings } = await supabase
            .from('auto_gifting_settings')
            .select('auto_approve_gifts')
            .eq('user_id', userId)
            .single();

          const shouldAutoApprove = settings?.auto_approve_gifts || false;
          const finalStatus = shouldAutoApprove ? 'approved' : 'pending_approval';

          // Update execution with selected products
          const { data: updateResult, error: updateError } = await supabase
            .from('automated_gift_executions')
            .update({
              status: finalStatus,
              selected_products: selectedProducts,
              total_amount: selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0),
              updated_at: new Date().toISOString(),
              ai_agent_source: {
                agent: 'nicole',
                data_sources: selectedProducts.map(p => p.source),
                confidence_score: 0.85,
                discovery_method: 'wishlist_optimization'
              }
            })
            .eq('id', execution.id)
            .select();

          if (updateError) {
            console.error(`❌ Failed to update execution ${execution.id}:`, updateError);
            throw new Error(`Database update failed: ${updateError.message}`);
          }

          console.log(`✅ Successfully processed execution ${execution.id} with ${selectedProducts.length} products`);

          // If auto-approved, proceed to order placement
          if (shouldAutoApprove && selectedProducts.length > 0) {
            console.log(`🛒 Auto-approved execution ${execution.id}, proceeding to order placement...`);
            
            // DON'T auto-place orders yet - just leave as 'approved' for manual order placement
            // This ensures proper order flow through the existing approve-auto-gift function
            console.log(`✅ Execution ${execution.id} auto-approved but will require manual order placement via approve-auto-gift`);
          }
          
          // Create appropriate notification
          const notificationType = shouldAutoApprove ? 'gift_auto_approved' : 'gift_suggestions_ready';
          const title = shouldAutoApprove ? 'Gift Auto-Approved & Scheduled' : 'Gift Suggestions Ready for Review';
          const message = shouldAutoApprove 
            ? `Auto-approved ${selectedProducts.length} gift(s) totaling $${selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}`
            : `Found ${selectedProducts.length} gift suggestions within your $${rule.budget_limit || 50} budget - review needed`;

          await supabase
            .from('auto_gift_notifications')
            .insert({
              user_id: userId,
              notification_type: notificationType,
              title: title,
              message: message,
              execution_id: execution.id
            });

        } catch (processError) {
          console.error(`❌ Error in gift processing for execution ${execution.id}:`, processError);
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'failed',
              error_message: `Processing failed: ${processError.message}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
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