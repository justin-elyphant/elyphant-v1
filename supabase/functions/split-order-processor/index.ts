import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryGroup {
  id: string;
  connectionId: string;
  connectionName: string;
  items: string[];
  giftMessage?: string;
  scheduledDeliveryDate?: string;
  shippingAddress?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId } = await req.json();
    console.log(`🔀 Split Order Processor started for order: ${orderId}`);

    // Get parent order details
    const { data: parentOrder, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !parentOrder) {
      throw new Error(`Failed to fetch parent order: ${orderError?.message}`);
    }

    // Parse cart data to get delivery groups - prioritize cart_data.deliveryGroups
    const cartData = parentOrder.cart_data || {};
    const deliveryGroups: DeliveryGroup[] = (cartData.deliveryGroups && Array.isArray(cartData.deliveryGroups))
      ? cartData.deliveryGroups
      : (parentOrder.delivery_groups || []);

    console.log(`📦 Found ${deliveryGroups.length} delivery groups`);

    if (deliveryGroups.length === 0) {
      console.log(`⚠️ No delivery groups found, processing as single order`);
      
      // Process as single order
      const { data, error } = await supabase.functions.invoke('process-zma-order', {
        body: { 
          orderId,
          triggerSource: 'split-processor-single',
          isScheduled: false
        }
      });

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Single order processed',
        orderId,
        result: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Multi-recipient order - create child orders
    const childOrders = [];
    const totalSplits = deliveryGroups.length;

    for (let i = 0; i < deliveryGroups.length; i++) {
      const group = deliveryGroups[i];
      
      console.log(`📨 Processing delivery group ${i + 1}/${totalSplits}: ${group.connectionName}`);

      // Normalize group item IDs to strings and filter order_items
      const groupProductIds = (group.items || []).map((i: any) => 
        typeof i === 'string' ? i : (i?.product_id ?? i)
      );
      
      const groupItems = parentOrder.order_items.filter((item: any) => 
        groupProductIds.includes(item.product_id)
      );

      if (groupItems.length === 0) {
        console.log(`⚠️ No items found for group ${group.id}, skipping`);
        continue;
      }

      // Validate shipping address
      const isValidAddress = Boolean(
        group.shippingAddress?.address && 
        group.shippingAddress?.zipCode
      );

      console.log(`📍 Address validation for ${group.connectionName}: ${isValidAddress ? 'VALID ✅' : 'INVALID ❌'}`);
      if (!isValidAddress) {
        console.log(`   Missing: ${!group.shippingAddress?.address ? 'address ' : ''}${!group.shippingAddress?.zipCode ? 'zipCode' : ''}`);
      }

      // Calculate subtotal for this group
      const groupSubtotal = groupItems.reduce((sum: number, item: any) => 
        sum + (item.unit_price * item.quantity), 0
      );

      // Proportional split of fees (shipping, tax, gifting fee)
      const totalSubtotal = parentOrder.subtotal || parentOrder.total_amount || groupSubtotal;
      const proportion = totalSubtotal > 0 ? groupSubtotal / totalSubtotal : 1;
      
      const groupShipping = (parentOrder.shipping_cost || 0) * proportion;
      const groupTax = (parentOrder.tax_amount || 0) * proportion;
      const groupGiftingFee = (parentOrder.gifting_fee || 0) * proportion;
      const groupTotal = groupSubtotal + groupShipping + groupTax + groupGiftingFee;

      // Create child order
      const { data: childOrder, error: childError } = await supabase
        .from('orders')
        .insert({
          user_id: parentOrder.user_id,
          parent_order_id: parentOrder.id,
          delivery_group_id: group.id,
          is_split_order: true,
          split_order_index: i + 1,
          total_split_orders: totalSplits,
          order_number: `${parentOrder.order_number}-${i + 1}`,
          status: isValidAddress ? 'pending' : 'awaiting_address',
          payment_status: 'succeeded', // Parent already paid
          stripe_payment_intent_id: parentOrder.stripe_payment_intent_id,
          currency: parentOrder.currency || 'USD',
          total_amount: groupTotal,
          subtotal: groupSubtotal,
          shipping_cost: groupShipping,
          tax_amount: groupTax,
          gifting_fee: groupGiftingFee,
          shipping_info: isValidAddress ? group.shippingAddress : {
            name: group.connectionName || 'Address Pending',
            address_line1: group.shippingAddress?.address || '',
            address_line2: group.shippingAddress?.addressLine2 || '',
            city: group.shippingAddress?.city || '',
            state: group.shippingAddress?.state || '',
            zip_code: group.shippingAddress?.zipCode || '',
            country: group.shippingAddress?.country || 'US',
            email: parentOrder.shipping_info?.email || ''
          },
          scheduled_delivery_date: group.scheduledDeliveryDate || parentOrder.scheduled_delivery_date || null,
          has_multiple_recipients: false, // Child orders are single-recipient
          cart_data: {
            ...cartData,
            deliveryGroups: [group], // Only this group
            recipient: {
              name: group.connectionName,
              connectionId: group.connectionId
            },
            giftOptions: {
              ...cartData.giftOptions,
              giftMessage: group.giftMessage || cartData.giftOptions?.giftMessage
            }
          }
        })
        .select()
        .single();

      if (childError) {
        console.error(`❌ Failed to create child order ${i + 1}:`, childError);
        console.error(`❌ Insert payload keys: ${Object.keys(childOrder || {}).join(', ')}`);
        throw childError;
      }

      console.log(`✅ Created child order ${childOrder.order_number} (${childOrder.id})`);

      // Create order items for child order
      const childOrderItems = groupItems.map((item: any) => {
        const qty = Number(item.quantity ?? 1);
        const unitPrice = Number(item.unit_price ?? 0);
        
        return {
          order_id: childOrder.id,
          delivery_group_id: group.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          vendor: 'zma',
          quantity: qty,
          unit_price: unitPrice,
          total_price: qty * unitPrice, // CRITICAL: Satisfy NOT NULL constraint
          recipient_connection_id: group.connectionId || null,
          selected_variations: item.selected_variations,
          variation_text: item.variation_text || null,
          recipient_gift_message: group.giftMessage,
          scheduled_delivery_date: group.scheduledDeliveryDate || item.scheduled_delivery_date || null
        };
      });

      console.log(`📦 Creating ${childOrderItems.length} order items for child ${i + 1}`);
      console.log(`🧪 First child order item preview:`, {
        product_id: childOrderItems[0]?.product_id,
        product_name: childOrderItems[0]?.product_name,
        quantity: childOrderItems[0]?.quantity,
        unit_price: childOrderItems[0]?.unit_price,
        total_price: childOrderItems[0]?.total_price,
        vendor: childOrderItems[0]?.vendor
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(childOrderItems);

      if (itemsError) {
        console.error(`❌ Failed to create order items for child ${i + 1}:`, itemsError);
        throw itemsError;
      }

      console.log(`📦 Created ${childOrderItems.length} order items for child order`);

      // Handle invalid address - create note and skip ZMA processing
      if (!isValidAddress) {
        console.log(`⚠️ Invalid shipping address for group ${group.id}, marking as awaiting_address`);
        
        await supabase.from('order_notes').insert({
          order_id: childOrder.id,
          note_content: `Recipient address required; shipment on hold. Missing: ${!group.shippingAddress?.address ? 'street address' : ''} ${!group.shippingAddress?.zipCode ? 'zip code' : ''}`.trim(),
          note_type: 'address_required',
          is_internal: false
        });

        childOrders.push({
          orderId: childOrder.id,
          orderNumber: childOrder.order_number,
          success: false,
          error: 'Invalid shipping address - awaiting recipient details'
        });
        
        continue;
      }

      // Process this child order through ZMA (only if valid address)
      console.log(`🚀 Invoking process-zma-order for child ${childOrder.id}`);
      
      const { data: processResult, error: processError } = await supabase.functions.invoke('process-zma-order', {
        body: { 
          orderId: childOrder.id,
          triggerSource: 'split-processor',
          isScheduled: false,
          isSplitOrder: true,
          splitIndex: i + 1,
          totalSplits
        }
      });

      if (processError) {
        console.error(`❌ Failed to process child order ${i + 1}:`, processError);
        // Update child order status to failed
        await supabase
          .from('orders')
          .update({ 
            status: 'failed',
            payment_status: 'processing_failed'
          })
          .eq('id', childOrder.id);
        
        childOrders.push({
          orderId: childOrder.id,
          orderNumber: childOrder.order_number,
          success: false,
          error: processError.message
        });
      } else {
        console.log(`✅ Child order ${i + 1} processed successfully`);
        childOrders.push({
          orderId: childOrder.id,
          orderNumber: childOrder.order_number,
          success: true,
          result: processResult
        });
      }
    }

    // Update parent order status
    const allSuccess = childOrders.every(o => o.success);
    const anySuccess = childOrders.some(o => o.success);
    
    let parentStatus = 'failed';
    if (allSuccess) {
      parentStatus = 'processing';
    } else if (anySuccess) {
      parentStatus = 'partially_processed';
    }

    await supabase
      .from('orders')
      .update({ 
        status: parentStatus,
        is_split_order: true,
        total_split_orders: totalSplits
      })
      .eq('id', orderId);

    console.log(`✅ Split order processing complete: ${childOrders.length} orders created`);

    return new Response(JSON.stringify({
      success: allSuccess,
      message: allSuccess 
        ? 'All orders processed successfully'
        : anySuccess
        ? 'Some orders processed successfully'
        : 'All orders failed',
      parentOrderId: orderId,
      parentOrderNumber: parentOrder.order_number,
      childOrders,
      totalSplits
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error in split-order-processor:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
