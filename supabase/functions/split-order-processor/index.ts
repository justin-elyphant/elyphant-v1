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

    // Parse cart data to get delivery groups
    const cartData = parentOrder.cart_data || {};
    const deliveryGroups: DeliveryGroup[] = cartData.deliveryGroups || [];

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

      // Filter items for this delivery group
      const groupItems = parentOrder.order_items.filter((item: any) => 
        group.items.includes(item.product_id)
      );

      if (groupItems.length === 0) {
        console.log(`⚠️ No items found for group ${group.id}, skipping`);
        continue;
      }

      // Calculate subtotal for this group
      const groupSubtotal = groupItems.reduce((sum: number, item: any) => 
        sum + (item.unit_price * item.quantity), 0
      );

      // Proportional split of fees (shipping, tax, gifting fee)
      const totalSubtotal = parentOrder.subtotal_amount || parentOrder.total_amount;
      const proportion = groupSubtotal / totalSubtotal;
      
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
          status: 'pending',
          payment_status: 'succeeded', // Parent already paid
          stripe_payment_intent_id: parentOrder.stripe_payment_intent_id,
          total_amount: groupTotal,
          subtotal_amount: groupSubtotal,
          shipping_cost: groupShipping,
          tax_amount: groupTax,
          gifting_fee: groupGiftingFee,
          shipping_info: group.shippingAddress || parentOrder.shipping_info,
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
        throw childError;
      }

      console.log(`✅ Created child order ${childOrder.order_number} (${childOrder.id})`);

      // Create order items for child order
      const childOrderItems = groupItems.map((item: any) => ({
        order_id: childOrder.id,
        delivery_group_id: group.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        product_image: item.product_image,
        selected_variations: item.selected_variations,
        gift_message: group.giftMessage
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(childOrderItems);

      if (itemsError) {
        console.error(`❌ Failed to create order items for child ${i + 1}:`, itemsError);
        throw itemsError;
      }

      console.log(`📦 Created ${childOrderItems.length} order items for child order`);

      // Process this child order through ZMA
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
