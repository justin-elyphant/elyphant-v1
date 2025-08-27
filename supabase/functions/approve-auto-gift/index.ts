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

    // Accept both pending_approval and processing statuses to support unified system workflow
    if (execution.status !== 'pending_approval' && execution.status !== 'processing') {
      return new Response(
        JSON.stringify({ error: `Execution is not in an approvable status. Current status: ${execution.status}` }),
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

    // Proceed to order placement with payment processing
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

      // Get payment method for processing
      const { data: paymentMethod, error: paymentError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', execution.auto_gifting_rules.payment_method_id)
        .single();

      if (paymentError || !paymentMethod) {
        throw new Error(`Payment method not found: ${paymentError?.message || 'No payment method configured'}`);
      }

      console.log(`💳 Using payment method: **** ${paymentMethod.last_four} (${paymentMethod.card_type})`);

      // Process payment first using the stored payment method
      const orderTotal = finalProducts.reduce((sum, p) => sum + (p.price || 0), 0);
      
      console.log(`💰 Processing payment of $${orderTotal.toFixed(2)} using saved payment method`);
      
      // Call create-payment-session function to process payment
      const { data: paymentResult, error: paymentProcessError } = await supabase.functions.invoke('create-payment-session', {
        body: {
          amount: orderTotal,
          currency: 'usd',
          useExistingPaymentMethod: true,
          paymentMethodId: paymentMethod.stripe_payment_method_id,
          metadata: {
            auto_gift_execution_id: executionId,
            recipient_id: execution.auto_gifting_rules.recipient_id,
            rule_id: execution.auto_gifting_rules.id,
            is_auto_gift: true
          }
        }
      });

      if (paymentProcessError || !paymentResult?.success) {
        throw new Error(`Payment processing failed: ${paymentProcessError?.message || 'Payment failed'}`);
      }

      console.log(`✅ Payment processed successfully: ${paymentResult.payment_intent_id}`);

      // Create the order record with payment information
      const { data: newOrder, error: createOrderError } = await supabase
        .from('orders')
        .insert({
          user_id: execution.user_id,
          total_amount: orderTotal,
          status: 'processing',
          payment_status: 'succeeded',
          payment_intent_id: paymentResult.payment_intent_id,
          order_number: `AUTO-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}-${Math.floor(Math.random() * 1000)}`,
          shipping_info: recipientProfile.shipping_address || {},
          is_gift: true,
          gift_message: `Auto-gift from your auto-gifting rule`,
          order_metadata: {
            auto_gift_execution_id: executionId,
            recipient_id: execution.auto_gifting_rules.recipient_id,
            rule_id: execution.auto_gifting_rules.id,
            payment_method_used: paymentMethod.id
          }
        })
        .select()
        .single();

      if (createOrderError || !newOrder) {
        throw new Error(`Failed to create order: ${createOrderError?.message}`);
      }

      console.log(`✅ Created order ${newOrder.id} for execution ${executionId}`);

      // Add order items
      const orderItemsData = finalProducts.map(product => ({
        order_id: newOrder.id,
        product_id: product.product_id || product.id,
        product_name: product.title || product.name,
        quantity: 1,
        price: product.price,
        product_url: product.url,
        product_image: product.image,
        marketplace: product.marketplace || 'amazon'
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) {
        console.error(`❌ Failed to create order items:`, itemsError);
        // Delete the order since items failed
        await supabase.from('orders').delete().eq('id', newOrder.id);
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }

      // Call process-zma-order edge function to handle actual order placement
      const orderPlacementResponse = await supabase.functions.invoke('process-zma-order', {
        body: {
          orderId: newOrder.id, // Use the real order ID
          isAutoGift: true,
          executionData: {
            execution_id: executionId,
            user_id: execution.user_id,
            recipient_id: execution.auto_gifting_rules.recipient_id,
            products: finalProducts,
            total_amount: orderTotal,
            shipping_info: recipientProfile.shipping_address || {},
            budget_limit: execution.auto_gifting_rules.budget_limit,
            payment_processed: true,
            payment_intent_id: paymentResult.payment_intent_id
          }
        }
      });

      // Use database transaction to ensure both order and execution are updated together
      if (orderPlacementResponse.error) {
        console.error(`❌ Order placement failed for execution ${executionId}:`, orderPlacementResponse.error);
        
        // Update order status to failed
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', newOrder.id);

        // Reset execution status to pending_approval for retry
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'pending_approval',
            order_id: newOrder.id, // Still link the order even if failed for tracking
            error_message: `Order placement failed: ${orderPlacementResponse.error.message}. Please retry.`,
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
            error: 'Order placement failed - execution reset to pending_approval for retry',
            details: orderPlacementResponse.error.message,
            status: 'pending_approval',
            orderId: newOrder.id
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log(`✅ Order placement initiated for execution ${executionId}, order ${newOrder.id}`);
        
        // CRITICAL: Update execution with order_id and completed status in a transaction-safe way
        const { error: executionUpdateError } = await supabase
          .from('automated_gift_executions')
          .update({
            status: 'completed',
            order_id: newOrder.id,
            selected_products: finalProducts, // Ensure products are preserved
            total_amount: orderTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', executionId);

        if (executionUpdateError) {
          console.error(`❌ Failed to update execution ${executionId}:`, executionUpdateError);
          // This is critical - we need to ensure the execution is properly linked
          throw new Error(`Failed to update execution record: ${executionUpdateError.message}`);
        }

        console.log(`✅ Execution ${executionId} successfully linked to order ${newOrder.id}`);

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
            status: 'completed',
            orderId: newOrder.id,
            orderNumber: newOrder.order_number,
            productCount: finalProducts.length,
            totalAmount: orderTotal
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (orderError) {
      console.error(`❌ Error in order placement for execution ${executionId}:`, orderError);
      
      await supabase
        .from('automated_gift_executions')
        .update({
          status: 'pending_approval',
          error_message: `Order placement error: ${orderError.message}. Please retry.`,
          updated_at: new Date().toISOString()
        })
        .eq('id', executionId);

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Order placement failed - execution reset to pending_approval for retry',
          details: orderError.message,
          status: 'pending_approval'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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