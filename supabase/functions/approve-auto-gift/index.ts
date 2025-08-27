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

    const { executionId, selectedProductIds, approvalDecision, rejectionReason } = await req.json();

    if (!executionId) {
      return new Response(
        JSON.stringify({ error: 'Execution ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Processing approval for execution ${executionId}, decision: ${approvalDecision}`);

    // Get the execution record
    const { data: execution, error: executionError } = await supabase
      .from('automated_gift_executions')
      .select(`
        *,
        auto_gifting_rules (*)
      `)
      .eq('id', executionId)
      .single();

    if (executionError || !execution) {
      console.error('❌ Error fetching execution:', executionError);
      return new Response(
        JSON.stringify({ error: 'Execution not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (execution.status !== 'pending_approval') {
      return new Response(
        JSON.stringify({ error: 'Execution is not in pending_approval status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (approvalDecision === 'rejected') {
      // Handle rejection
      await supabase
        .from('automated_gift_executions')
        .update({
          status: 'rejected',
          error_message: rejectionReason || 'User rejected the gift selection',
          updated_at: new Date().toISOString()
        })
        .eq('id', executionId);

      // Create notification
      await supabase
        .from('auto_gift_notifications')
        .insert({
          user_id: execution.user_id,
          notification_type: 'gift_rejected',
          title: 'Gift Selection Rejected',
          message: rejectionReason || 'You have rejected the auto-gift selection',
          execution_id: executionId
        });

      console.log(`✅ Execution ${executionId} rejected successfully`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Gift selection rejected successfully',
          status: 'rejected'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle approval
    let finalProducts = execution.selected_products;
    
    // If specific product IDs were selected, filter the products
    if (selectedProductIds && selectedProductIds.length > 0) {
      finalProducts = execution.selected_products?.filter(product => 
        selectedProductIds.includes(product.id)
      ) || [];
    }

    // Update execution to approved status
    await supabase
      .from('automated_gift_executions')
      .update({
        status: 'approved',
        selected_products: finalProducts,
        total_amount: finalProducts.reduce((sum, p) => sum + (p.price || 0), 0),
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId);

    console.log(`✅ Execution ${executionId} approved with ${finalProducts.length} products`);

    // Proceed to order placement
    try {
      // Get recipient profile for shipping info
      const { data: recipientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', execution.auto_gifting_rules.recipient_id)
        .single();

      if (profileError || !recipientProfile) {
        throw new Error(`Failed to fetch recipient profile: ${profileError?.message}`);
      }

      // Call process-zma-order edge function to handle order placement
      const orderPlacementResponse = await supabase.functions.invoke('process-zma-order', {
        body: {
          orderId: executionId, // Use execution ID as order reference
          isAutoGift: true,
          executionData: {
            execution_id: executionId,
            user_id: execution.user_id,
            recipient_id: execution.auto_gifting_rules.recipient_id,
            products: finalProducts,
            total_amount: finalProducts.reduce((sum, p) => sum + (p.price || 0), 0),
            shipping_info: recipientProfile.shipping_address || {},
            budget_limit: execution.auto_gifting_rules.budget_limit
          }
        }
      });

      if (orderPlacementResponse.error) {
        console.error(`❌ Order placement failed for execution ${executionId}:`, orderPlacementResponse.error);
        
        // Update execution status to indicate order failure
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'order_failed',
            error_message: `Order placement failed: ${orderPlacementResponse.error.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', executionId);

        // Create failure notification
        await supabase
          .from('auto_gift_notifications')
          .insert({
            user_id: execution.user_id,
            notification_type: 'order_failed',
            title: 'Order Placement Failed',
            message: `Failed to place order for approved gifts: ${orderPlacementResponse.error.message}`,
            execution_id: executionId
          });

        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Order placement failed',
            details: orderPlacementResponse.error.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log(`✅ Order placement initiated for execution ${executionId}`);
        
        // Update execution status to order_placed
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'order_placed',
            updated_at: new Date().toISOString()
          })
          .eq('id', executionId);

        // Create success notification
        await supabase
          .from('auto_gift_notifications')
          .insert({
            user_id: execution.user_id,
            notification_type: 'order_placed',
            title: 'Gift Order Placed',
            message: `Your approved gifts have been ordered and will be delivered soon`,
            execution_id: executionId
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Gift approved and order placed successfully',
            status: 'order_placed',
            productCount: finalProducts.length,
            totalAmount: finalProducts.reduce((sum, p) => sum + (p.price || 0), 0)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (orderError) {
      console.error(`❌ Error in order placement for execution ${executionId}:`, orderError);
      
      await supabase
        .from('automated_gift_executions')
        .update({
          status: 'order_failed',
          error_message: `Order placement error: ${orderError.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', executionId);

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Order placement failed',
          details: orderError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Error in approve-auto-gift function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});