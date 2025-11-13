import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate dynamic gift messages
function getGiftMessage(execution: any): string {
  const rule = execution.auto_gifting_rules;
  
  // 1. Check for custom gift message in the rule
  if (rule.gift_message && rule.gift_message.trim() !== '') {
    console.log('🎁 [approve-auto-gift] Using custom gift message from rule');
    return rule.gift_message.trim();
  }
  
  // 2. Check for gift preferences that might contain a message
  if (rule.gift_preferences?.message && rule.gift_preferences.message.trim() !== '') {
    console.log('🎁 [approve-auto-gift] Using gift message from preferences');
    return rule.gift_preferences.message.trim();
  }
  
  // 3. Generate personalized message based on occasion and relationship
  const occasion = rule.date_type;
  const recipientName = getRecipientName(execution);
  
  console.log('🎁 [approve-auto-gift] Generating personalized gift message for occasion:', occasion);
  
  const personalizedMessages: { [key: string]: string } = {
    'birthday': `Happy Birthday, ${recipientName}! 🎂 Hope your special day is amazing!`,
    'anniversary': `Happy Anniversary, ${recipientName}! 💕 Celebrating this special milestone with you!`,
    'christmas': `Merry Christmas, ${recipientName}! 🎄 Wishing you joy and happiness this holiday season!`,
    'valentine': `Happy Valentine's Day, ${recipientName}! 💝 You're special to me!`,
    'graduation': `Congratulations on your graduation, ${recipientName}! 🎓 So proud of your achievement!`,
    'wedding': `Congratulations on your wedding, ${recipientName}! 💍 Wishing you a lifetime of happiness!`,
    'just_because': `Thinking of you, ${recipientName}! 💕 Just wanted to brighten your day!`,
    'mothers_day': `Happy Mother's Day, ${recipientName}! 🌸 Thank you for everything you do!`,
    'fathers_day': `Happy Father's Day, ${recipientName}! 👔 You're the best!`,
    'new_baby': `Congratulations on your new baby, ${recipientName}! 👶 What an exciting time!`,
    'housewarming': `Congratulations on your new home, ${recipientName}! 🏠 Hope you love it!`
  };
  
  return personalizedMessages[occasion] || `Hope you enjoy this thoughtful gift, ${recipientName}! 🎁`;
}

// Helper function to extract recipient name
function getRecipientName(execution: any): string {
  // Try to get name from various sources
  if (execution.recipient_name) return execution.recipient_name;
  if (execution.auto_gifting_rules?.recipient_name) return execution.auto_gifting_rules.recipient_name;
  
  // If we have recipient profile data in the execution context
  const rule = execution.auto_gifting_rules;
  if (rule.pending_recipient_email) {
    // Extract name from email before @ symbol as fallback
    const emailName = rule.pending_recipient_email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  
  return 'Friend'; // Generic fallback
}

serve(async (req) => {
  console.log('🚀 [approve-auto-gift] Function invoked');
  console.log('📊 [approve-auto-gift] Request method:', req.method);
  console.log('🔧 [approve-auto-gift] Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔑 [approve-auto-gift] Creating Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('📦 [approve-auto-gift] Parsing request body...');
    const requestBody = await req.json();
    console.log('📋 [approve-auto-gift] Raw request body:', JSON.stringify(requestBody, null, 2));
    
    const { executionId, selectedProductIds, approvalDecision, rejectionReason } = requestBody;
    
    console.log('🎯 [approve-auto-gift] Processing approval request:');
    console.log('   - Execution ID:', executionId);
    console.log('   - Selected Product IDs:', selectedProductIds);
    console.log('   - Approval Decision:', approvalDecision);
    console.log('   - Rejection Reason:', rejectionReason);

    console.log('✅ [approve-auto-gift] Request body parsed successfully');

    if (!executionId) {
      console.error('❌ [approve-auto-gift] Missing execution ID');
      return new Response(
        JSON.stringify({ error: 'Execution ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 [approve-auto-gift] Processing approval for execution ${executionId}, decision: ${approvalDecision}`);

    // Get the execution record
    console.log('🔍 [approve-auto-gift] Fetching execution details for ID:', executionId);
    const { data: execution, error: executionError } = await supabase
      .from('automated_gift_executions')
      .select(`
        *,
        auto_gifting_rules (*)
      `)
      .eq('id', executionId)
      .single();

    if (executionError || !execution) {
      console.error('❌ [approve-auto-gift] Error fetching execution:', executionError);
      return new Response(
        JSON.stringify({ error: 'Execution not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 [approve-auto-gift] Current execution details:');
    console.log('   - Status:', execution.status);
    console.log('   - User ID:', execution.user_id);
    console.log('   - Rule ID:', execution.rule_id);
    console.log('   - Selected Products:', execution.selected_products?.length || 0, 'products');
    console.log('   - Order ID:', execution.order_id);

    // Accept both pending_approval and processing statuses to support unified system workflow
    console.log('🔍 [approve-auto-gift] Checking execution status...');
    if (execution.status !== 'pending_approval' && execution.status !== 'processing') {
      console.log(`ℹ️ [approve-auto-gift] Execution not in approvable status: ${execution.status}`);
      return new Response(
        JSON.stringify({ error: `Execution is not in an approvable status. Current status: ${execution.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (approvalDecision === 'rejected') {
      console.log('❌ [approve-auto-gift] Processing rejection...');
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

      console.log(`✅ [approve-auto-gift] Execution ${executionId} rejected successfully`);
      
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
    console.log('✅ [approve-auto-gift] Processing approval...');
    let finalProducts = execution.selected_products;
    
    // If specific product IDs were selected, filter the products
    console.log('📦 [approve-auto-gift] Processing product selection...');
    if (selectedProductIds && selectedProductIds.length > 0) {
      console.log('🎯 [approve-auto-gift] Filtering to selected products:', selectedProductIds);
      finalProducts = execution.selected_products?.filter((product: any) => 
        selectedProductIds.includes(product.id)
      ) || [];
    }
    
    console.log('📋 [approve-auto-gift] Final products to order:', JSON.stringify(finalProducts, null, 2));

    // Update execution to approved status
    console.log('📝 [approve-auto-gift] Updating execution to approved status...');
    const totalAmount = finalProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
    console.log('💰 [approve-auto-gift] Total amount:', totalAmount);
    
    await supabase
      .from('automated_gift_executions')
      .update({
        status: 'approved',
        selected_products: finalProducts,
        total_amount: totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId);

    console.log(`✅ [approve-auto-gift] Execution ${executionId} approved with ${finalProducts.length} products`);

    // Proceed to order placement with payment processing
    console.log('🛒 [approve-auto-gift] Starting order placement process...');
    try {
      // Check if this is a pending recipient (no recipient_id, only email)
      const isPendingRecipient = !execution.auto_gifting_rules.recipient_id && execution.auto_gifting_rules.pending_recipient_email;
      
      if (isPendingRecipient) {
        console.log('📬 [approve-auto-gift] Pending recipient detected - requesting address collection');
        
        // Generate address collection token
        const { data: tokenData } = await supabase.rpc('generate_address_collection_token');
        const addressToken = tokenData;
        
        // Store address request
        await supabase.from('pending_recipient_addresses').insert({
          execution_id: executionId,
          recipient_email: execution.auto_gifting_rules.pending_recipient_email,
          token: addressToken,
          requested_by: execution.user_id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });
        
        // Update execution status
        await supabase.from('automated_gift_executions').update({
          status: 'awaiting_address',
          address_collection_status: 'requested',
          address_collection_token: addressToken,
          pending_recipient_email: execution.auto_gifting_rules.pending_recipient_email
        }).eq('id', executionId);
        
        // Get sender's name for the email
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', execution.user_id)
          .single();
        
        const senderName = senderProfile?.name || 'Someone';
        
        // Send address request email
        const addressRequestUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/collect-recipient-address?token=${addressToken}`;
        
        await supabase.functions.invoke('ecommerce-email-orchestrator', {
          body: {
            eventType: 'address_request',
            data: {
              requester_name: senderName,
              recipient_name: execution.auto_gifting_rules.pending_recipient_email.split('@')[0],
              recipient_email: execution.auto_gifting_rules.pending_recipient_email,
              occasion: execution.auto_gifting_rules.date_type || 'a special occasion',
              request_url: addressRequestUrl,
              message: 'We need your shipping address to complete your gift delivery.'
            }
          }
        });
        
        console.log('✅ [approve-auto-gift] Address request sent - execution on hold');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Address request sent to recipient',
            status: 'awaiting_address',
            executionId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Build shipping info based on recipient type
      let shippingInfo;
      
      // Check if this is a pending recipient with collected address
      if (isPendingRecipient && execution.address_collection_status === 'received') {
        console.log('📬 [approve-auto-gift] Using collected address for pending recipient');
        
        // Get collected address
        const { data: addressData, error: addressError } = await supabase
          .from('pending_recipient_addresses')
          .select('shipping_address, recipient_email')
          .eq('execution_id', executionId)
          .single();
          
        if (addressError || !addressData) {
          throw new Error(`Failed to retrieve collected address: ${addressError?.message}`);
        }
        
        const address = addressData.shipping_address;
        const nameParts = (address.name || 'Recipient').split(' ');
        
        // Build shipping info from collected address
        shippingInfo = {
          first_name: nameParts[0] || 'Recipient',
          last_name: nameParts.slice(1).join(' ') || '',
          address_line1: address.address_line1,
          address_line2: address.address_line2 || '',
          city: address.city,
          state: address.state,
          zip_code: address.zip_code,
          country: address.country || 'US',
          phone_number: '5551234567' // Default, no phone collected
        };
        
        console.log('✅ [approve-auto-gift] Shipping info built from collected address');
      } else {
        // Get recipient profile for shipping info (registered users)
        console.log('👤 [approve-auto-gift] Fetching recipient profile...');
        const { data: recipientProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', execution.auto_gifting_rules.recipient_id)
          .single();

        if (profileError || !recipientProfile) {
          console.error('❌ [approve-auto-gift] Failed to fetch recipient profile:', profileError);
          throw new Error(`Failed to fetch recipient profile: ${profileError?.message}`);
        }
        
        console.log('✅ [approve-auto-gift] Recipient profile fetched successfully');
      
      // Log gift message source for debugging
      const rule = execution.auto_gifting_rules;
      console.log('🎁 [approve-auto-gift] Gift message analysis:');
      console.log('   - Rule gift_message:', rule.gift_message);
      console.log('   - Rule gift_preferences:', JSON.stringify(rule.gift_preferences, null, 2));

      // Process real payment using stored payment method
      const orderTotal = finalProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
      
      console.log(`💰 Processing auto-gift order of $${orderTotal.toFixed(2)} with real Stripe payment`);
      
      // Get the payment method from the auto-gifting rule
      const paymentMethodId = execution.auto_gifting_rules.payment_method_id;
      
      if (!paymentMethodId) {
        throw new Error('No payment method configured for this auto-gifting rule. Please update your auto-gift settings.');
      }
      
      console.log(`💳 Using payment method: ${paymentMethodId}`);
      
      // Create real payment intent using stored payment method
      // Get the original authorization header to pass to create-payment-intent
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header found for payment processing');
      }

      // Create a separate supabase client for the payment call that includes auth
      const supabaseWithAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: {
              Authorization: authHeader
            }
          }
        }
      );

      const paymentResponse = await supabaseWithAuth.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(orderTotal * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            useExistingPaymentMethod: true,
            paymentMethodId: paymentMethodId,
            auto_gift_execution_id: executionId,
            user_id: execution.user_id,
            order_type: 'auto_gift',
            rule_id: execution.rule_id,
            execution_id: executionId
          }
        }
      });
      
      if (paymentResponse.error) {
        console.error('❌ Payment intent creation failed:', paymentResponse.error);
        
        // Log failed payment attempt
        await supabase.from('auto_gift_payment_audit').insert({
          execution_id: executionId,
          payment_intent_id: 'creation_failed',
          status: 'failed',
          amount: Math.round(orderTotal * 100),
          error_message: paymentResponse.error.message,
        });
        
        throw new Error(`Payment processing failed: ${paymentResponse.error.message}`);
      }
      
      const paymentResult = paymentResponse.data;
      const paymentIntentId = paymentResult.payment_intent_id;
      
      // Store payment intent ID immediately
      await supabase
        .from('automated_gift_executions')
        .update({
          stripe_payment_intent_id: paymentIntentId,
          last_payment_attempt_at: new Date().toISOString(),
        })
        .eq('id', executionId);
      
      console.log(`💾 Stored payment intent ID: ${paymentIntentId}`);
      
      // Log payment attempt
      await supabase.from('auto_gift_payment_audit').insert({
        execution_id: executionId,
        payment_intent_id: paymentIntentId,
        status: paymentResult.status,
        amount: Math.round(orderTotal * 100),
        payment_method_id: paymentMethodId,
        stripe_response: paymentResult,
      });
      
      // Verify payment was successful before proceeding
      if (paymentResult.status !== 'succeeded') {
        console.error('❌ Payment not confirmed:', paymentResult);
        
        // Set up retry schedule (12h from now for first retry)
        const nextRetryAt = new Date();
        nextRetryAt.setHours(nextRetryAt.getHours() + 12);
        
        // Mark for retry instead of immediate failure
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'payment_retry_pending',
            payment_status: 'failed',
            payment_error_message: `Payment failed with status: ${paymentResult.status}`,
            payment_retry_count: 0,
            next_payment_retry_at: nextRetryAt.toISOString(),
          })
          .eq('id', executionId);
        
        // Notify user about retry
        await supabase.functions.invoke('ecommerce-email-orchestrator', {
          body: {
            eventType: 'auto_gift_payment_retrying',
            userId: execution.user_id,
            executionId: executionId,
            retryCount: 1,
            nextRetryAt: nextRetryAt.toISOString(),
            errorMessage: `Payment failed with status: ${paymentResult.status}`,
          },
        });
        
        throw new Error(`Payment failed with status: ${paymentResult.status}. We'll retry in 12 hours.`);
      }
      
      // Update payment status
      await supabase
        .from('automated_gift_executions')
        .update({
          payment_status: 'succeeded',
          payment_confirmed_at: new Date().toISOString(),
        })
        .eq('id', executionId);
      
      console.log(`✅ Real payment confirmed for auto-gift: ${paymentIntentId}`);

      // Calculate order breakdown for required fields
      const subtotal = orderTotal;
      const shippingCost = 0; // Auto-gifts have free shipping
      const taxAmount = 0; // Auto-gifts are tax-free for now
      const currency = 'USD';
      
        // Extract shipping address with proper field mapping
        const rawAddress = recipientProfile.shipping_address || {};
        console.log('🏠 [approve-auto-gift] Raw shipping address:', JSON.stringify(rawAddress, null, 2));
        
        // Extract recipient name parts
        const fullName = recipientProfile.name || 'Recipient';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || 'Recipient';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Proper address field mapping with multiple fallback options
        shippingInfo = {
          first_name: firstName,
          last_name: lastName,
          address_line1: rawAddress.street || rawAddress.address_line1 || '',
          address_line2: rawAddress.line2 || rawAddress.address_line2 || '',
          city: rawAddress.city || '',
          state: rawAddress.state || '',
          zip_code: rawAddress.zipCode || rawAddress.zip_code || '',
          country: rawAddress.country || 'US',
          phone_number: recipientProfile.phone || '5551234567'
        };
        
        console.log('📦 [approve-auto-gift] Mapped shipping info:', JSON.stringify(shippingInfo, null, 2));
      }
      
      // Validate required fields
      if (!shippingInfo.address_line1) {
        console.error('❌ [approve-auto-gift] Missing required shipping field: address_line1');
        throw new Error('Missing required shipping address information');
      }

      // ========== SMART DELIVERY TIMING CALCULATION ==========
      console.log('⏰ [approve-auto-gift] Calculating optimal delivery timing...');
      
      // Get the target event date from execution
      const targetEventDate = execution.execution_date ? new Date(execution.execution_date) : null;
      let shouldHoldOrder = false;
      let zincScheduledDate = null;
      let orderStatus = 'processing';
      
      if (targetEventDate) {
        const today = new Date();
        const daysUntilEvent = Math.ceil((targetEventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`📅 [approve-auto-gift] Event date: ${targetEventDate.toISOString()}, Days until event: ${daysUntilEvent}`);
        
        // If event is more than 6 days away, hold the order
        if (daysUntilEvent > 6) {
          // Submit order 4 days before event (assumes 2-day Amazon Prime shipping)
          const optimalSubmissionDate = new Date(targetEventDate);
          optimalSubmissionDate.setDate(optimalSubmissionDate.getDate() - 4);
          
          shouldHoldOrder = true;
          zincScheduledDate = optimalSubmissionDate.toISOString();
          orderStatus = 'scheduled';
          
          console.log(`🔒 [approve-auto-gift] Holding order until ${optimalSubmissionDate.toISOString()} (4 days before event)`);
        } else {
          console.log(`🚀 [approve-auto-gift] Event is within 6 days - processing immediately`);
        }
      }
      
      // Create the order record with all required fields
      const { data: newOrder, error: createOrderError } = await supabase
        .from('orders')
        .insert({
          user_id: execution.user_id,
          total_amount: orderTotal,
          subtotal: subtotal,
          shipping_cost: shippingCost,
          tax_amount: taxAmount,
          currency: currency,
          status: orderStatus,
          payment_status: 'succeeded',
          stripe_payment_intent_id: paymentResult.payment_intent_id,
          order_number: `AUTO-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}-${Math.floor(Math.random() * 1000)}`,
          shipping_info: shippingInfo,
          is_gift: true,
          gift_message: getGiftMessage(execution),
          hold_for_scheduled_delivery: shouldHoldOrder,
          zinc_scheduled_processing_date: zincScheduledDate,
          scheduled_delivery_date: targetEventDate?.toISOString(),
          gift_options: {
            auto_gift_execution_id: executionId,
            recipient_id: execution.auto_gifting_rules.recipient_id,
            rule_id: execution.auto_gifting_rules.id,
            payment_method_used: paymentMethodId
          }
        })
        .select()
        .single();

      if (createOrderError || !newOrder) {
        throw new Error(`Failed to create order: ${createOrderError?.message}`);
      }

      console.log(`✅ Created order ${newOrder.id} for execution ${executionId}`);

      // Add order items using correct schema columns (matching marketplace orders)
      const orderItemsData = finalProducts.map((product: any) => {
        const unitPrice = product.price;
        const quantity = 1;
        return {
          order_id: newOrder.id,
          product_id: product.product_id || product.id,
          product_name: product.title || product.name,
          quantity: quantity,
          unit_price: unitPrice,
          total_price: unitPrice * quantity,
          product_image: product.image,
          vendor: product.vendor || product.retailer || 'amazon'
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) {
        console.error(`❌ Failed to create order items:`, itemsError);
        // Delete the order since items failed
        await supabase.from('orders').delete().eq('id', newOrder.id);
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }

      // Check if order should be held for scheduled delivery
      if (shouldHoldOrder) {
        console.log(`🕐 [approve-auto-gift] Order ${newOrder.id} held for scheduled delivery on ${zincScheduledDate}`);
        
        // Update execution to scheduled status
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'scheduled',
            order_id: newOrder.id,
          })
          .eq('id', executionId);
        
        // Send scheduled notification
        await supabase.functions.invoke('ecommerce-email-orchestrator', {
          body: {
            eventType: 'auto_gift_scheduled',
            userId: execution.user_id,
            orderNumber: newOrder.order_number,
            scheduledDate: zincScheduledDate,
            eventDate: targetEventDate?.toISOString()
          }
        });
        
        console.log(`✅ [approve-auto-gift] Order scheduled successfully`);
      } else {
        // Queue for async fulfillment (immediate processing)
        console.log(`📦 [approve-auto-gift] Queueing order ${newOrder.id} for async fulfillment`);
        
        await supabase.from('auto_gift_fulfillment_queue').insert({
          execution_id: executionId,
          order_id: newOrder.id,
          status: 'queued',
        });
        
        console.log(`✅ [approve-auto-gift] Order queued for fulfillment`);
        
        // Update execution status to approved (will be moved to 'completed' after fulfillment)
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'approved',
            order_id: newOrder.id,
          })
          .eq('id', executionId);
      }
      
      // For backward compatibility, keep the old synchronous call as a comment
      // The fulfillment queue processor will handle this asynchronously
      const orderPlacementResponse = { 
        data: { 
          success: true, 
          message: 'Order queued for async fulfillment',
          queued: true 
        } 
      };

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
    } catch (orderError: any) {
      console.error(`❌ Error in order placement for execution ${executionId}:`, orderError);
      
      // Check if this is a payment-related error and provide specific messaging
      let errorMessage = orderError?.message || 'Unknown error occurred';
      let shouldRetry = true;
      
      if (errorMessage.includes('Payment')) {
        // Payment-specific error handling
        console.log('💳 Payment error detected, may need payment method update');
        shouldRetry = false; // Don't auto-retry payment failures
      }
      
      await supabase
        .from('automated_gift_executions')
        .update({
          status: shouldRetry ? 'pending_approval' : 'failed',
          error_message: `${shouldRetry ? 'Order placement error' : 'Payment error'}: ${errorMessage}. ${shouldRetry ? 'Please retry.' : 'Please check your payment method.'}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', executionId);

      // Create appropriate notification based on error type
      await supabase
        .from('auto_gift_notifications')
        .insert({
          user_id: execution.user_id,
          notification_type: shouldRetry ? 'order_failed' : 'payment_failed',
          title: shouldRetry ? 'Order Processing Failed' : 'Payment Failed',
          message: shouldRetry 
            ? `Order processing failed: ${errorMessage}. Please try again.`
            : `Payment failed: ${errorMessage}. Please check your payment method and auto-gift settings.`,
          execution_id: executionId
        });

      return new Response(
        JSON.stringify({ 
          success: false,
          error: shouldRetry ? 'Order placement failed - execution reset to pending_approval for retry' : 'Payment failed - please check payment method',
          details: errorMessage,
          status: shouldRetry ? 'pending_approval' : 'failed'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('💥 [approve-auto-gift] Caught exception:', error);
    console.error('🔍 [approve-auto-gift] Exception details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    const errorResponse = { 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    console.log('📤 [approve-auto-gift] Sending error response:', JSON.stringify(errorResponse, null, 2));
    
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});