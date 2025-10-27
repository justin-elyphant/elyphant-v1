// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Resend client
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface EmailRequest {
  eventType: 
    | 'order_created' 
    | 'order_status_changed' 
    | 'order_cancelled' 
    | 'cart_abandoned'
    | 'post_purchase_followup' 
    | 'auto_gift_approval' 
    | 'gift_invitation'
    | 'gift_invitation_with_connection_request'
    | 'connection_invitation'
    | 'connection_accepted'
    | 'connection_welcome'
    | 'password_reset'
    | 'password_changed'
    | 'account_deletion'
    | 'wishlist_welcome'
    | 'address_request'
    | 'nudge_reminder'
    | 'birthday_reminder_curated'
    | 'birthday_connection_no_autogift'
    | 'birthday_connection_with_autogift'
    | 'gift_purchased_for_you'
    | 'wishlist_item_purchased'
    | 'wishlist_purchase_confirmation'
    | 'wishlist_weekly_summary';
  orderId?: string;
  userId?: string;
  cartSessionId?: string;
  customData?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, orderId, userId, cartSessionId, customData }: EmailRequest = await req.json();
    
    console.log(`Processing email event: ${eventType}`, { orderId, userId, cartSessionId });

    // Create Supabase client with service role for full access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let result;
    
    switch (eventType) {
      case 'order_created':
        result = await handleOrderConfirmation(supabase, orderId!);
        break;
      case 'order_status_changed':
        result = await handleOrderStatusUpdate(supabase, orderId!, customData?.status);
        break;
      case 'order_cancelled':
        result = await handleOrderCancellation(supabase, orderId!);
        break;
      case 'cart_abandoned':
        result = await handleAbandonedCart(supabase, cartSessionId!);
        break;
      case 'post_purchase_followup':
        result = await handlePostPurchaseFollowup(supabase, orderId!);
        break;
      case 'auto_gift_approval':
        result = await handleAutoGiftApproval(supabase, customData!);
        break;
    case 'gift_invitation':
      result = await handleGiftInvitation(supabase, customData!);
      break;
    case 'gift_invitation_with_connection_request':
      result = await handleGiftInvitationWithConnection(supabase, customData!);
      break;
    case 'connection_invitation':
        result = await handleConnectionInvitation(supabase, customData!);
        break;
      case 'connection_accepted':
        result = await handleConnectionAccepted(supabase, customData!);
        break;
      case 'connection_welcome':
        result = await handleConnectionWelcome(supabase, customData!);
        break;
      case 'password_reset':
        result = await handlePasswordReset(supabase, customData!);
        break;
      case 'password_changed':
        result = await handlePasswordChanged(supabase, customData!);
        break;
      case 'account_deletion':
        result = await handleAccountDeletion(supabase, customData!);
        break;
      case 'wishlist_welcome':
        result = await handleWishlistWelcome(supabase, customData!);
        break;
      case 'address_request':
        result = await handleAddressRequest(supabase, customData!);
        break;
      case 'nudge_reminder':
        result = await handleNudgeReminder(supabase, customData!);
        break;
      case 'birthday_reminder_curated':
        result = await handleBirthdayReminderCurated(supabase, customData!);
        break;
      case 'birthday_connection_no_autogift':
        result = await handleBirthdayConnectionNoAutogift(supabase, customData!);
        break;
      case 'birthday_connection_with_autogift':
        result = await handleBirthdayConnectionWithAutogift(supabase, customData!);
        break;
      case 'gift_purchased_for_you':
        result = await handleGiftPurchasedNotification(supabase, customData!);
        break;
      case 'wishlist_item_purchased':
        result = await handleWishlistItemPurchased(supabase, customData!);
        break;
      case 'wishlist_purchase_confirmation':
        result = await handleWishlistPurchaseConfirmation(supabase, customData!);
        break;
      case 'wishlist_weekly_summary':
        result = await handleWishlistWeeklySummary(supabase, customData!);
        break;
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      result,
      eventType 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in ecommerce-email-orchestrator:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process email event" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function handleOrderConfirmation(supabase: any, orderId: string) {
  console.log(`📧 Starting order confirmation for order: ${orderId}`);
  
  // Get order details with payment information
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Check if confirmation email already sent
  if (order.confirmation_email_sent) {
    console.log(`Order confirmation already sent for ${orderId}`);
    return { skipped: true, reason: 'already_sent' };
  }

  // Fetch recipient profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, first_name, email')
    .eq('id', order.user_id)
    .maybeSingle();

  if (profileError) {
    console.warn('Profile lookup error:', profileError.message);
  }
  
  const recipientFirstName = profile?.first_name || profile?.name || 'Friend';
  const recipientEmail = profile?.email;
  
  if (!recipientEmail) {
    throw new Error(`Recipient email not found for user ${order.user_id}`);
  }

  // Import the enhanced order confirmation template
  const { orderConfirmationTemplate } = await import('./email-templates/order-confirmation.ts');

  // Fetch Stripe payment details
  let paymentMethod = 'Card';
  let paymentBrand = '';
  let paymentLast4 = '';
  let transactionId = '';
  
  if (order.stripe_payment_intent_id) {
    try {
      const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
        Deno.env.get('STRIPE_SECRET_KEY') || '',
        { apiVersion: '2023-10-16' }
      );
      
      const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
      transactionId = paymentIntent.id;
      
      if (paymentIntent.charges?.data?.[0]?.payment_method_details) {
        const pmDetails = paymentIntent.charges.data[0].payment_method_details;
        if (pmDetails.card) {
          paymentBrand = pmDetails.card.brand || 'Card';
          paymentLast4 = pmDetails.card.last4 || '';
          paymentMethod = `${paymentBrand.charAt(0).toUpperCase() + paymentBrand.slice(1)} •••• ${paymentLast4}`;
        }
      }
    } catch (stripeError) {
      console.warn('Failed to fetch Stripe payment details:', stripeError);
    }
  }

  // Calculate estimated delivery date (5-7 business days)
  const estimatedDeliveryDate = new Date(order.created_at);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);
  const estimatedDelivery = estimatedDeliveryDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Check if multi-recipient order
  const isMultiRecipient = order.has_multiple_recipients === true;
  
  let templateProps: any;
  
  if (isMultiRecipient) {
    console.log(`🎁 Multi-recipient order detected, fetching child orders...`);
    
    // Fetch child orders
    const { data: childOrders, error: childError } = await supabase
      .from('orders')
      .select('*')
      .eq('parent_order_id', orderId)
      .order('created_at', { ascending: true });
    
    if (childError) {
      console.error('Failed to fetch child orders:', childError);
    }
    
    const childOrdersData = childOrders || [];
    const recipientCount = childOrdersData.length;
    
    // Build child orders array for template
    const childOrdersFormatted = await Promise.all(childOrdersData.map(async (childOrder: any) => {
      // Fetch order items for this child order
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', childOrder.id);
      
      const items = (orderItems || []).map((item: any) => ({
        name: item.product_name || 'Product',
        quantity: item.quantity || 1,
        price: `$${(item.unit_price || 0).toFixed(2)}`,
        image: item.product_image || null
      }));
      
      // Extract recipient location (city, state, zip only for privacy)
      const shippingInfo = childOrder.shipping_info || {};
      const recipientLocation = `${shippingInfo.city || ''}, ${shippingInfo.state || ''} ${shippingInfo.zip_code || ''}`.trim();
      
      const childEstimatedDelivery = new Date(childOrder.created_at);
      childEstimatedDelivery.setDate(childEstimatedDelivery.getDate() + 7);
      
      return {
        recipient_name: shippingInfo.name || 'Recipient',
        recipient_location: recipientLocation || 'Address on file',
        items,
        gift_message: childOrder.gift_options?.giftMessage || null,
        estimated_delivery: childEstimatedDelivery.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric' 
        }),
        order_details_url: `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}/orders/${childOrder.id}`
      };
    }));
    
    // Get all items across all child orders for the summary
    const { data: allItems } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', childOrdersData.map((co: any) => co.id));
    
    const formattedItems = (allItems || []).map((item: any) => ({
      name: item.product_name || 'Product',
      quantity: item.quantity || 1,
      price: `$${(item.unit_price || 0).toFixed(2)}`,
      image: item.product_image || null
    }));
    
    templateProps = {
      first_name: recipientFirstName,
      order_number: order.order_number,
      total_amount: `$${(order.total_amount || 0).toFixed(2)}`,
      order_date: new Date(order.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      items: formattedItems,
      shipping_address: '', // Not used for multi-recipient
      payment_method: paymentMethod,
      payment_brand: paymentBrand,
      payment_last4: paymentLast4,
      transaction_date: new Date(order.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      transaction_id: transactionId,
      order_details_url: `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')?.replace('.supabase.co', '')}/orders/${order.id}`,
      subtotal: `$${(order.subtotal || 0).toFixed(2)}`,
      shipping_cost: `$${(order.shipping_cost || 0).toFixed(2)}`,
      tax_amount: order.tax_amount ? `$${order.tax_amount.toFixed(2)}` : null,
      is_multi_recipient: true,
      recipient_count: recipientCount,
      child_orders: childOrdersFormatted
    };
  } else {
    // Single-recipient order
    console.log(`📦 Single-recipient order`);
    
    // Fetch order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    
    const formattedItems = (orderItems || []).map((item: any) => ({
      name: item.product_name || 'Product',
      quantity: item.quantity || 1,
      price: `$${(item.unit_price || 0).toFixed(2)}`,
      image: item.product_image || null
    }));
    
    const shippingAddr = order.shipping_info?.address_line1 
      ? `${order.shipping_info.name || ''}\n${order.shipping_info.address_line1}\n${order.shipping_info.city}, ${order.shipping_info.state} ${order.shipping_info.zip_code}\n${order.shipping_info.country || 'United States'}`
      : 'Address on file';
    
    templateProps = {
      first_name: recipientFirstName,
      order_number: order.order_number,
      total_amount: `$${(order.total_amount || 0).toFixed(2)}`,
      order_date: new Date(order.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      items: formattedItems,
      shipping_address: shippingAddr,
      payment_method: paymentMethod,
      payment_brand: paymentBrand,
      payment_last4: paymentLast4,
      transaction_date: new Date(order.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      transaction_id: transactionId,
      order_details_url: `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')?.replace('.supabase.co', '')}/orders/${order.id}`,
      estimated_delivery: estimatedDelivery,
      subtotal: `$${(order.subtotal || 0).toFixed(2)}`,
      shipping_cost: `$${(order.shipping_cost || 0).toFixed(2)}`,
      tax_amount: order.tax_amount ? `$${order.tax_amount.toFixed(2)}` : null,
      is_multi_recipient: false
    };
  }

  // Generate HTML using the enhanced template
  const htmlContent = orderConfirmationTemplate(templateProps);
  
  // Send email
  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [recipientEmail],
    subject: isMultiRecipient 
      ? `Order Confirmed! 🎉 ${templateProps.recipient_count} Gifts - Payment Received - Order #${order.order_number}`
      : `Order Confirmed! 🎉 Payment Received - Order #${order.order_number}`,
    html: htmlContent,
  });

  console.log(`✅ Order confirmation email sent to ${recipientEmail}`);

  // Update order status and log event
  await Promise.all([
    supabase
      .from('orders')
      .update({ confirmation_email_sent: true })
      .eq('id', orderId),
    
    supabase
      .from('order_email_events')
      .insert({
        order_id: orderId,
        email_type: 'order_confirmation',
        recipient_email: recipientEmail,
        template_variables: { 
          first_name: recipientFirstName, 
          order_number: order.order_number,
          is_multi_recipient: isMultiRecipient
        },
        resend_message_id: emailResponse.data?.id
      })
  ]);

  return { emailSent: true, messageId: emailResponse.data?.id, isMultiRecipient };
}

async function handleOrderStatusUpdate(supabase: any, orderId: string, newStatus: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles(name, email)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Add fallback for missing profile
  if (!order.profiles) {
    console.warn(`⚠️ Profile not found for order ${orderId}, using fallback`);
    order.profiles = { name: 'Customer', email: 'no-reply@elyphant.ai' };
  }

  // Check if status update email already sent for this status
  const sentEmails = order.status_update_emails_sent || [];
  if (sentEmails.includes(newStatus)) {
    console.log(`Status update email already sent for ${orderId} status ${newStatus}`);
    return { skipped: true, reason: 'already_sent' };
  }

  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_type', 'order_status_update')
    .eq('is_active', true)
    .single();

  if (!template) {
    throw new Error('Order status update template not found');
  }

  const statusMessages = {
    'confirmed': 'Your order has been confirmed and is being prepared.',
    'shipped': 'Great news! Your order has been shipped and is on its way.',
    'delivered': 'Your order has been delivered. We hope you love it!',
    'processing': 'Your order is currently being processed.'
  };

  const variables = {
    customer_name: order.profiles?.name || 'Valued Customer',
    order_number: order.order_number,
    status: newStatus,
    status_message: statusMessages[newStatus as keyof typeof statusMessages] || '',
    tracking_number: order.tracking_number || '',
    estimated_delivery: order.estimated_delivery || '',
    order_tracking_url: `${Deno.env.get('SITE_URL')}/orders/${order.id}`
  };

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [order.profiles.email],
    subject: replaceVariables(template.subject_template, variables),
    html: replaceVariables(template.html_template, variables),
  });

  // Update sent emails array
  const updatedSentEmails = [...sentEmails, newStatus];
  
  await Promise.all([
    supabase
      .from('orders')
      .update({ status_update_emails_sent: updatedSentEmails })
      .eq('id', orderId),
    
    supabase
      .from('order_email_events')
      .insert({
        order_id: orderId,
        email_type: 'order_status_update',
        recipient_email: order.profiles.email,
        template_id: template.id,
        template_variables: variables,
        resend_message_id: emailResponse.data?.id
      })
  ]);

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handleOrderCancellation(supabase: any, orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles(name, email)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Add fallback for missing profile
  if (!order.profiles) {
    console.warn(`⚠️ Profile not found for order ${orderId}, using fallback`);
    order.profiles = { name: 'Customer', email: 'no-reply@elyphant.ai' };
  }

  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_type', 'order_cancellation')
    .eq('is_active', true)
    .single();

  if (!template) {
    throw new Error('Order cancellation template not found');
  }

  const variables = {
    customer_name: order.profiles?.name || 'Valued Customer',
    order_number: order.order_number,
    cancellation_date: new Date().toLocaleDateString(),
    refund_amount: (order.total_amount / 100).toFixed(2),
    cancellation_reason: order.cancellation_reason || 'Customer request',
    shop_url: `${Deno.env.get('SITE_URL')}/shop`
  };

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [order.profiles.email],
    subject: replaceVariables(template.subject_template, variables),
    html: replaceVariables(template.html_template, variables),
  });

  await supabase
    .from('order_email_events')
    .insert({
      order_id: orderId,
      email_type: 'order_cancellation',
      recipient_email: order.profiles.email,
      template_id: template.id,
      template_variables: variables,
      resend_message_id: emailResponse.data?.id
    });

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handleAbandonedCart(supabase: any, cartSessionId: string) {
  const { data: cartSession, error } = await supabase
    .from('cart_sessions')
    .select(`
      *,
      profiles(name, first_name, email)
    `)
    .eq('id', cartSessionId)
    .single();

  if (error || !cartSession) {
    throw new Error(`Cart session not found: ${cartSessionId}`);
  }

  if (!cartSession.profiles) {
    console.warn(`⚠️ Profile not found for cart session ${cartSessionId}`);
    return { skipped: true, reason: 'no_profile' };
  }

  // Don't send if cart was recovered or completed
  if (cartSession.is_recovered || cartSession.completed_at) {
    return { skipped: true, reason: 'cart_recovered_or_completed' };
  }

  const cartItems = cartSession.cart_data?.items || [];
  const itemsHtml = cartItems.slice(0, 3).map((item: any) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #1a1a1a; font-weight: 600;">${item.title}</p>
        <p style="margin: 5px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #9333ea; font-weight: 700;">$${item.price}</p>
      </td>
    </tr>
  `).join('');

  const styledHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 30px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%);">
              <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff;">Elyphant</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">Your cart is waiting! 🛒</h2>
              <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #666666;">
                Hi ${cartSession.profiles.first_name || cartSession.profiles.name || 'Friend'}, you left some great items in your cart.
              </p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 20px 0 0 0; text-align: right;">
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; color: #1a1a1a; font-weight: 700;">Total: $${(cartSession.total_amount / 100).toFixed(2)}</p>
                  </td>
                </tr>
              </table>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${Deno.env.get('SITE_URL')}/checkout?session=${cartSession.session_id}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600;">Complete Your Purchase</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #fafafa; text-align: center;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #999999;">© ${new Date().getFullYear()} Elyphant. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [cartSession.profiles.email],
    subject: `Your cart is waiting - ${cartItems.length} items inside! 🛒`,
    html: styledHtml,
  });

  await supabase
    .from('cart_sessions')
    .update({ 
      recovery_emails_sent: (cartSession.recovery_emails_sent || 0) + 1,
      last_recovery_email_sent: new Date().toISOString()
    })
    .eq('id', cartSessionId);

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handlePostPurchaseFollowup(supabase: any, orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles(name, first_name, email)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  if (!order.profiles) {
    console.warn(`⚠️ Profile not found for order ${orderId}`);
    return { skipped: true, reason: 'no_profile' };
  }

  // Check if followup email already sent
  if (order.followup_email_sent) {
    return { skipped: true, reason: 'already_sent' };
  }

  // Only send if order was delivered
  if (order.status !== 'delivered') {
    return { skipped: true, reason: 'order_not_delivered' };
  }

  const styledHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 30px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%);">
              <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff;">Elyphant</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">How's everything going? 💝</h2>
              <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #666666;">
                Hi ${order.profiles.first_name || order.profiles.name || 'Friend'}, we hope you're enjoying your recent purchase!
              </p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border: 1px solid #bae6fd;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #0369a1; text-transform: uppercase;">Order #${order.order_number}</p>
                  </td>
                </tr>
              </table>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${Deno.env.get('SITE_URL')}/orders/${order.id}/review" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600;">Leave a Review</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #fafafa; text-align: center;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #999999;">© ${new Date().getFullYear()} Elyphant. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [order.profiles.email],
    subject: `How's your recent order? We'd love your feedback!`,
    html: styledHtml,
  });

  await Promise.all([
    supabase
      .from('orders')
      .update({ followup_email_sent: true })
      .eq('id', orderId),
    
    supabase
      .from('order_email_events')
      .insert({
        order_id: orderId,
        email_type: 'post_purchase_followup',
        recipient_email: order.profiles.email,
        resend_message_id: emailResponse.data?.id
      })
  ]);

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handleAutoGiftApproval(supabase: any, customData: any) {
  const styledHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 30px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%);">
              <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff;">Elyphant</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">Auto-Gift Approval Required 🎁</h2>
              <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #666666;">
                Your auto-gift for ${customData.recipientName}'s ${customData.occasion} is ready!
              </p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 20px; border-left: 4px solid #9333ea;">
                <tr>
                  <td>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #1a1a1a;">
                      <strong>Budget:</strong> $${customData.budget}<br/>
                      <strong>Total Amount:</strong> $${customData.totalAmount.toFixed(2)}
                    </p>
                  </td>
                </tr>
              </table>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 10px;">
                    <a href="${customData.approveUrl}" style="display: inline-block; padding: 14px 32px; background: #22c55e; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; margin: 5px;">✅ Approve Gift</a>
                    <a href="${customData.rejectUrl}" style="display: inline-block; padding: 14px 32px; background: #ef4444; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; margin: 5px;">❌ Reject</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #fafafa; text-align: center;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #999999;">© ${new Date().getFullYear()} Elyphant. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [customData.recipientEmail],
    subject: `Auto-Gift Approval: ${customData.occasion} for ${customData.recipientName}`,
    html: styledHtml,
  });

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handleGiftInvitation(supabase: any, customData: any) {
  const styledHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 30px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%);">
              <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff;">Elyphant</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">You've been invited! 🎉</h2>
              <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #666666;">
                ${customData.senderName} wants to connect with you on Elyphant!
              </p>
              
              ${customData.customMessage ? `
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #9333ea;">
                <tr>
                  <td>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #6b21a8; font-style: italic;">"${customData.customMessage}"</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${customData.invitationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600;">Accept Invitation</a>
                  </td>
                </tr>
              </table>
            <strong>Perfect Gift Matching:</strong> Create your wishlist and preferences so ${customData.giftorName} knows exactly what you love
          </li>
          <li style="margin: 15px 0; padding-left: 30px; position: relative;">
            <span style="position: absolute; left: 0; top: 2px; font-size: 18px;">🤖</span>
            <strong>AI-Powered Curation:</strong> Nicole, our AI gift advisor, learns your style and suggests amazing options
          </li>
          <li style="margin: 15px 0; padding-left: 30px; position: relative;">
            <span style="position: absolute; left: 0; top: 2px; font-size: 18px;">🎉</span>
            <strong>Surprise & Delight:</strong> Never get another gift you don't want - every surprise will be perfect
          </li>
          <li style="margin: 15px 0; padding-left: 30px; position: relative;">
            <span style="position: absolute; left: 0; top: 2px; font-size: 18px;">🔒</span>
            <strong>Privacy First:</strong> Your preferences are private - only you and your gift-givers see them
          </li>
        </ul>

        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748;">
            <strong>Ready to get gifts you'll love?</strong><br>
            Join Elyphant and help ${customData.giftorName} pick the perfect gifts for you!
          </p>
          
          <a href="${customData.invitationUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 0;">
            🎁 Create My Profile & Wishlist
          </a>
        </div>
      </div>

      <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 30px;">
        <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">🚀 Getting started is easy:</h3>
        
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <span style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">1</span>
            <span>Click the link above to create your profile (takes 2 minutes)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 15px;">
            <span style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">2</span>
            <span>Tell Nicole about your interests, brands you love, and sizes</span>
          </div>
          <div style="display: flex; align-items: center; gap: 15px;">
            <span style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">3</span>
            <span>Enjoy receiving perfectly curated gifts from ${customData.giftorName}!</span>
          </div>
        </div>
      </div>

      <div style="text-align: center; padding: 20px; color: #718096; font-size: 14px;">
        <p style="margin: 0 0 10px 0;">
          This invitation was sent by ${customData.giftorName} through Elyphant.
        </p>
        <p style="margin: 0;">
          Questions? Reply to this email or visit our help center.
        </p>
      </div>

    </body>
    </html>
  `;

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [customData.recipientEmail],
    subject: `${customData.giftorName} invited you to join Elyphant!`,
    html: htmlContent,
  });

  console.log("✅ Gift invitation email sent successfully");
  return { success: true, emailId: emailResponse.data?.id };
}

async function handleGiftInvitationWithConnection(supabase: any, customData: any) {
  console.log('📧 🎁 Sending hybrid gift + connection invitation email:', customData);
  
  // Import the new hybrid template
  const { giftInvitationWithConnectionTemplate } = await import('./email-templates/index.ts');
  
  // Extract data (supports both queue metadata and direct customData)
  const senderName = customData.sender_name || customData.senderName || 'Someone';
  const recipientEmail = customData.recipient_email || customData.recipientEmail;
  const recipientName = customData.recipient_name || customData.recipientName || 'there';
  const giftOccasion = customData.gift_occasion || customData.giftOccasion;
  const giftMessage = customData.gift_message || customData.giftMessage;
  const connectionId = customData.connection_id || customData.connectionId;
  
  // Build signup URL with invitation token
  const baseUrl = Deno.env.get("SITE_URL") || "https://elyphant.ai";
  const signupUrl = connectionId 
    ? `${baseUrl}/auth?invite=${connectionId}`
    : `${baseUrl}/auth?signup=true`;
  
  // Use the hybrid template
  const htmlContent = giftInvitationWithConnectionTemplate({
    senderName,
    recipientName,
    recipientEmail,
    giftOccasion,
    giftMessage,
    signupUrl
  });

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [recipientEmail],
    subject: `🎁 ${senderName} sent you a gift through Elyphant!`,
    html: htmlContent,
  });

  console.log('✅ Gift + connection invitation email sent successfully');
  return { success: true, emailId: emailResponse.data?.id };
}

// ============= NEW EVENT HANDLERS =============

async function handleConnectionInvitation(supabase: any, customData: any) {
  console.log('📧 Sending connection invitation email:', customData);
  
  // Import template
  const { giftInvitationTemplate } = await import('./email-templates/index.ts');
  
  // Extract data from customData (supports both queue metadata and direct customData)
  const senderName = customData.sender_name || customData.senderName || 'Someone';
  const recipientEmail = customData.recipient_email || customData.recipientEmail;
  const recipientName = customData.recipient_name || customData.recipientName || 'there';
  const message = customData.message || customData.customMessage;
  const connectionId = customData.connection_id || customData.connectionId;
  
  // NEW: Fetch relationship type from connection record
  let relationshipType = 'friend'; // Default
  if (connectionId) {
    const { data: connection } = await supabase
      .from('user_connections')
      .select('relationship_type')
      .eq('id', connectionId)
      .single();
    
    if (connection?.relationship_type) {
      relationshipType = connection.relationship_type;
      console.log(`📊 Relationship type: ${relationshipType}`);
    }
  }
  
  // Build invitation URL
  const baseUrl = Deno.env.get("SITE_URL") || "https://elyphant.ai";
  const invitationUrl = connectionId 
    ? `${baseUrl}/auth?invite=${connectionId}`
    : `${baseUrl}/auth?signup=true`;
  
  // Use gift invitation template with relationship context
  const htmlContent = giftInvitationTemplate({
    sender_first_name: senderName,
    recipient_name: recipientName,
    invitation_url: invitationUrl,
    custom_message: message,
    relationship_type: relationshipType
  });

  // Personalized subject line based on relationship
  const subjectEmoji = getSubjectEmojiForEmail(relationshipType);
  const subject = `${senderName} invited you to connect on Elyphant! ${subjectEmoji}`;

  await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [recipientEmail],
    subject,
    html: htmlContent,
  });

  console.log('✅ Connection invitation email sent successfully');
  return { success: true };
}

// Helper for email subject
function getSubjectEmojiForEmail(relationship?: string): string {
  if (!relationship) return '🎉';
  
  const rel = relationship.toLowerCase();
  
  if (['father', 'mother', 'parent', 'son', 'daughter', 'child', 'brother', 'sister', 'sibling',
       'uncle', 'aunt', 'cousin', 'nephew', 'niece', 'grandfather', 'grandmother', 'grandparent',
       'grandson', 'granddaughter', 'grandchild'].includes(rel)) {
    return '👨‍👩‍👧‍👦';
  }
  
  if (['spouse', 'partner', 'fiancé', 'fiancée', 'boyfriend', 'girlfriend'].includes(rel)) {
    return '💕';
  }
  
  if (['colleague', 'coworker', 'boss', 'mentor'].includes(rel)) {
    return '🎁';
  }
  
  return '💝';
}

async function handleConnectionAccepted(supabase: any, customData: any) {
  console.log('📧 Sending connection accepted email:', customData);
  
  // Import template
  const { connectionAcceptedTemplate } = await import('./email-templates/index.ts');
  
  // Extract data (from database trigger metadata)
  const senderName = customData.sender_name || 'there';
  const acceptorName = customData.acceptor_name || 'Your connection';
  const senderEmail = customData.sender_email || customData.recipientEmail;
  
  const baseUrl = Deno.env.get("SITE_URL") || "https://elyphant.ai";
  const profileUrl = `${baseUrl}/connections`;
  
  const htmlContent = connectionAcceptedTemplate({
    sender_name: senderName,
    acceptor_name: acceptorName,
    profile_url: profileUrl
  });

  // Query sender email if not provided in metadata
  let recipientEmail = senderEmail;
  if (!recipientEmail && customData.connection_id) {
    const { data: connection } = await supabase
      .from('user_connections')
      .select('user_id, profiles!user_connections_user_id_fkey(email)')
      .eq('id', customData.connection_id)
      .single();
    
    recipientEmail = connection?.profiles?.email;
  }

  if (!recipientEmail) {
    console.error('❌ No recipient email found for connection accepted notification');
    return { success: false, error: 'No recipient email' };
  }

  await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [recipientEmail],
    subject: `${acceptorName} accepted your connection! 🎉`,
    html: htmlContent,
  });

  console.log('✅ Connection accepted email sent successfully');
  return { success: true };
}

async function handleConnectionWelcome(supabase: any, customData: any) {
  console.log('📧 Sending connection welcome email:', customData);
  
  // Import template
  const { connectionWelcomeTemplate } = await import('./email-templates/index.ts');
  
  // Extract data (from database trigger metadata)
  const recipientName = customData.recipient_name || 'there';
  const newConnectionName = customData.new_connection_name || 'Your new connection';
  const recipientEmail = customData.recipient_email || customData.recipientEmail;
  
  const baseUrl = Deno.env.get("SITE_URL") || "https://elyphant.ai";
  const connectionsUrl = `${baseUrl}/connections`;
  
  const htmlContent = connectionWelcomeTemplate({
    recipient_name: recipientName,
    new_connection_name: newConnectionName,
    connections_url: connectionsUrl
  });

  if (!recipientEmail) {
    console.error('❌ No recipient email found for connection welcome');
    return { success: false, error: 'No recipient email' };
  }

  await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [recipientEmail],
    subject: `Welcome to Elyphant, ${recipientName}! 🎊`,
    html: htmlContent,
  });

  console.log('✅ Connection welcome email sent successfully');
  return { success: true };
}

async function handlePasswordReset(supabase: any, customData: any) {
  console.log("🔐 Sending password reset email");
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Reset Your Password</h1>
      <p>We received a request to reset your password.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${customData.resetLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #718096; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Elyphant Security <security@elyphant.ai>",
    to: [customData.email],
    subject: "Reset Your Password - Elyphant",
    html: htmlContent,
  });

  return { success: true };
}

async function handlePasswordChanged(supabase: any, customData: any) {
  console.log("✅ Sending password changed notification");
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #10b981;">Password Changed Successfully</h1>
      <p>Your password was recently changed.</p>
      <p>If you made this change, no further action is needed.</p>
      <p style="color: #ef4444; margin-top: 20px;"><strong>If you did not change your password, please contact support immediately.</strong></p>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Elyphant Security <security@elyphant.ai>",
    to: [customData.email],
    subject: "Your Password Was Changed - Elyphant",
    html: htmlContent,
  });

  return { success: true };
}

async function handleAccountDeletion(supabase: any, customData: any) {
  console.log("🗑️ Sending account deletion confirmation");
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #ef4444;">Account Deletion Confirmed</h1>
      <p>Hi ${customData.name},</p>
      <p>Your account has been successfully deleted. We're sorry to see you go!</p>
      <p>All your data has been removed from our systems.</p>
      <p style="color: #718096; margin-top: 20px;">If you change your mind, you can always create a new account.</p>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [customData.email],
    subject: "Account Deleted - Elyphant",
    html: htmlContent,
  });

  return { success: true };
}

async function handleWishlistWelcome(supabase: any, customData: any) {
  console.log("🎁 Sending personalized welcome email with product suggestions");
  
  const { 
    userEmail, 
    userFirstName, 
    interests = [] 
  } = customData;

  // Import the new template
  const { welcomeWithSuggestionsTemplate } = await import('./email-templates/index.ts');

  const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://elyphant.ai';
  
  let suggestedProducts: Array<{
    title: string;
    price: number;
    image: string;
    product_url: string;
  }> = [];

  // Fetch personalized products from Zinc API based on interests
  try {
    // Build search query from user interests
    const searchQuery = interests.length > 0 
      ? `${interests.slice(0, 2).join(' ')} best selling`
      : 'popular gifts trending';

    console.log(`🔍 Fetching products for query: "${searchQuery}"`);

    // Call get-products edge function (with 5-second timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const productsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        query: searchQuery,
        page: 1,
        limit: 6,
        filters: {
          minPrice: 10,
          maxPrice: 100
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (productsResponse.ok) {
      const data = await productsResponse.json();
      
      // Transform products for email template
      if (data.results && data.results.length > 0) {
        suggestedProducts = data.results.slice(0, 4).map((p: any) => ({
          title: p.title || 'Product',
          price: p.price || 0,
          image: p.image || 'https://via.placeholder.com/150',
          product_url: `${FRONTEND_URL}/marketplace?product=${p.product_id || ''}`
        }));
        
        console.log(`✅ Successfully fetched ${suggestedProducts.length} products`);
      } else {
        console.log('⚠️ No products returned from Zinc API');
      }
    } else {
      console.log(`⚠️ Zinc API returned status ${productsResponse.status}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('⏱️ Product fetch timeout - sending email without products');
    } else {
      console.log('⚠️ Product fetch error - sending email without products:', error.message);
    }
  }

  // Generate email HTML using the enhanced template
  const htmlContent = welcomeWithSuggestionsTemplate({
    first_name: userFirstName,
    dashboard_url: `${FRONTEND_URL}/dashboard?mode=signin`,
    profile_url: `${FRONTEND_URL}/settings?mode=signin`,
    suggested_products: suggestedProducts
  });

  await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [userEmail],
    subject: suggestedProducts.length > 0 
      ? "Welcome to Elyphant! Here are some gift ideas to get you started 🎁" 
      : "Welcome to Elyphant! 🎁",
    html: htmlContent,
  });

  console.log(`✅ Welcome email sent to ${userEmail} with ${suggestedProducts.length} product suggestions`);

  return { success: true, productsSent: suggestedProducts.length };
}

async function handleAddressRequest(supabase: any, customData: any) {
  console.log("📍 Sending address request email");
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">${customData.requesterName} needs your address</h1>
      <p>Hi ${customData.recipientName},</p>
      <p>${customData.requesterName} is requesting your shipping address${customData.occasion ? ` for ${customData.occasion}` : ''}.</p>
      ${customData.message ? `<p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">${customData.message}</p>` : ''}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${customData.requestUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Share Your Address</a>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [customData.recipientEmail],
    subject: `${customData.requesterName} requested your address`,
    html: htmlContent,
  });

  return { success: true };
}

async function handleNudgeReminder(supabase: any, customData: any) {
  console.log("👋 Sending nudge reminder");
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Friendly Reminder from ${customData.senderName}</h1>
      <p>Hi ${customData.recipientName},</p>
      <p>${customData.senderName} sent you a friendly reminder about joining Elyphant.</p>
      ${customData.customMessage ? `<p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">"${customData.customMessage}"</p>` : ''}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${customData.invitationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Join Now</a>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [customData.recipientEmail],
    subject: `Reminder from ${customData.senderName}`,
    html: htmlContent,
  });

  return { success: true };
}

// ============================================
// BIRTHDAY EMAIL HANDLERS
// ============================================

async function handleBirthdayReminderCurated(supabase: any, customData: any) {
  const { userId, birthdayDate, daysUntil } = customData;
  
  console.log(`🎂 Processing birthday reminder for user ${userId}`);
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, first_name, name, interests, dob')
    .eq('id', userId)
    .single();
  
  if (!profile?.email) {
    throw new Error(`Profile not found or missing email for user ${userId}`);
  }
  
  const curatedProducts = await curateProductsForBirthday(profile);
  const wishlistUrl = `https://dmkxtkvlispxeqfzlczr.supabase.co/wishlists/${userId}`;
  const shareUrl = `${wishlistUrl}/share`;
  
  const emailHtml = buildBirthdayReminderEmail({
    firstName: profile.first_name || profile.name || 'Friend',
    birthdayDate,
    daysUntil,
    curatedProducts,
    wishlistUrl,
    shareUrl
  });
  
  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [profile.email],
    subject: `${profile.first_name || 'Hey'}, Your Birthday is Coming Up! 🎂`,
    html: emailHtml
  });
  
  console.log(`✅ Birthday reminder sent to ${profile.email}`);
  
  return { 
    emailSent: true, 
    messageId: emailResponse.data?.id,
    productsIncluded: curatedProducts.length 
  };
}

async function curateProductsForBirthday(profile: any) {
  try {
    const interests = profile.interests || [];
    const searchQuery = interests.length > 0 
      ? interests.join(' birthday gifts') 
      : 'trending birthday gifts';
    
    console.log(`🔍 Searching products for: "${searchQuery}"`);
    
    const products = await searchProductsViaZincAPI(searchQuery, {
      maxResults: 6,
      minPrice: 20,
      maxPrice: 150
    });
    
    if (!products || products.length === 0) {
      console.warn('⚠️ No products found, using fallback');
      return await searchProductsViaZincAPI('birthday bestsellers', { maxResults: 6 });
    }
    
    return applyBrandDiversityFilter(products, 6);
    
  } catch (error) {
    console.error('❌ Product curation failed:', error);
    return [];
  }
}

async function searchProductsViaZincAPI(query: string, options: any) {
  const zincApiKey = Deno.env.get('ZINC_API_KEY');
  if (!zincApiKey) {
    throw new Error('ZINC_API_KEY not configured');
  }
  
  const response = await fetch('https://api.zinc.io/v1/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(zincApiKey + ':')}`
    },
    body: JSON.stringify({
      query: query,
      max_results: options.maxResults || 6,
      retailer: 'amazon',
      page: 1
    })
  });
  
  if (!response.ok) {
    throw new Error(`Zinc API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return (data.results || []).map((item: any) => ({
    product_id: item.product_id,
    title: item.title,
    price: item.price,
    image: item.image,
    retailer: 'amazon',
    fresh: item.fresh || false
  })).filter((p: any) => {
    const price = parseFloat(p.price);
    return price >= (options.minPrice || 0) && price <= (options.maxPrice || 999);
  });
}

function applyBrandDiversityFilter(products: any[], limit: number) {
  const brandCounts = new Map<string, number>();
  const diverseProducts = [];
  
  for (const product of products) {
    const brand = extractBrand(product.title);
    const count = brandCounts.get(brand) || 0;
    
    if (count < 2) {
      diverseProducts.push(product);
      brandCounts.set(brand, count + 1);
    }
    
    if (diverseProducts.length >= limit) break;
  }
  
  return diverseProducts;
}

function extractBrand(title: string): string {
  const match = title.match(/^([A-Z][a-zA-Z0-9]+)/);
  return match ? match[1] : 'Generic';
}

function buildBirthdayReminderEmail(props: {
  firstName: string;
  birthdayDate: string;
  daysUntil: number;
  curatedProducts: any[];
  wishlistUrl: string;
  shareUrl: string;
}) {
  const productGrid = props.curatedProducts.length > 0 ? `
    <h3 style="margin: 30px 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      Gift Ideas Just For You
    </h3>
    <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #666666;">
      Based on your interests, here are some gift ideas you might love:
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        ${props.curatedProducts.slice(0, 3).map(product => `
          <td width="33%" align="center" style="padding: 10px;">
            <img src="${product.image}" alt="${product.title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" />
            <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #333; font-weight: 500;">
              ${product.title.substring(0, 40)}...
            </p>
            <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #9333ea; font-weight: 600;">
              $${product.price}
            </p>
            <a href="${props.wishlistUrl}?add=${product.product_id}&utm_source=birthday_email&utm_campaign=birthday_reminder" style="display: inline-block; padding: 8px 16px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600;">
              Add to Wishlist
            </a>
          </td>
        `).join('')}
      </tr>
    </table>
  ` : '';
  
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 30px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%);">
              <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff;">Elyphant</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
                Your Birthday is Coming Up! 🎂
              </h2>
              <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #666666;">
                Hi ${props.firstName}, your birthday is on <strong>${props.birthdayDate}</strong> (${props.daysUntil} days away)!
              </p>
              <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #666666;">
                Make sure your wishlist is up to date so friends and family know exactly what you'd love to receive.
              </p>
              
              ${productGrid}
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${props.wishlistUrl}?utm_source=birthday_email&utm_campaign=update_wishlist" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600;">
                      Update My Wishlist
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${props.shareUrl}?utm_source=birthday_email&utm_campaign=share_wishlist" style="color: #9333ea; text-decoration: underline; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
                      Share Your Wishlist
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Elyphant. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function handleBirthdayConnectionNoAutogift(supabase: any, customData: any) {
  const { connectionUserId, birthdayUserName, birthdayDate, daysUntil, birthdayUserId } = customData;
  
  const { data: connectionProfile } = await supabase
    .from('profiles')
    .select('email, first_name, name')
    .eq('id', connectionUserId)
    .single();
  
  if (!connectionProfile?.email) {
    throw new Error(`Connection email not found for user ${connectionUserId}`);
  }
  
  const { data: wishlistItems } = await supabase
    .from('wishlist_items')
    .select('title, price, image_url')
    .eq('wishlist_id', birthdayUserId)
    .limit(3);
  
  const setupUrl = `https://dmkxtkvlispxeqfzlczr.supabase.co/auto-gifting/setup?recipient=${birthdayUserId}&utm_source=birthday_email`;
  const wishlistUrl = `https://dmkxtkvlispxeqfzlczr.supabase.co/wishlists/${birthdayUserId}?utm_source=birthday_email`;
  
  const emailHtml = buildConnectionNoAutogiftEmail({
    recipientName: connectionProfile.first_name || connectionProfile.name || 'Friend',
    birthdayUserName,
    birthdayDate,
    daysUntil,
    wishlistItems: wishlistItems || [],
    setupUrl,
    wishlistUrl
  });
  
  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [connectionProfile.email],
    subject: `${birthdayUserName}'s Birthday is Coming Up!`,
    html: emailHtml
  });
  
  console.log(`✅ Connection reminder sent to ${connectionProfile.email}`);
  
  return { emailSent: true, messageId: emailResponse.data?.id };
}

function buildConnectionNoAutogiftEmail(props: any) {
  const wishlistPreview = props.wishlistItems.length > 0 ? `
    <h3 style="margin: 30px 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 600; color: #1a1a1a;">
      From ${props.birthdayUserName}'s Wishlist
    </h3>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      ${props.wishlistItems.map((item: any) => `
        <tr>
          <td style="padding: 10px 0;">
            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #333;">
              ${item.title}
            </p>
            <p style="margin: 5px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #9333ea; font-weight: 600;">
              $${item.price}
            </p>
          </td>
        </tr>
      `).join('')}
    </table>
  ` : '';
  
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 30px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%);">
              <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff;">Elyphant</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
                ${props.birthdayUserName}'s Birthday is Coming Up!
              </h2>
              <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #666666;">
                Hi ${props.recipientName}, ${props.birthdayUserName}'s birthday is on <strong>${props.birthdayDate}</strong> (${props.daysUntil} days away)!
              </p>
              <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #666666;">
                Set up auto-gifting now and never miss their special day. We'll handle everything automatically!
              </p>
              
              ${wishlistPreview}
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 30px 0 10px 0;">
                    <a href="${props.setupUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600;">
                      Set Up Auto-Gifting
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${props.wishlistUrl}" style="color: #9333ea; text-decoration: underline; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
                      View ${props.birthdayUserName}'s Wishlist
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Elyphant. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function handleBirthdayConnectionWithAutogift(supabase: any, customData: any) {
  const { connectionUserId, birthdayUserName, birthdayDate, daysUntil, selectedGift } = customData;
  
  const { data: connectionProfile } = await supabase
    .from('profiles')
    .select('email, first_name, name')
    .eq('id', connectionUserId)
    .single();
  
  if (!connectionProfile?.email) {
    throw new Error(`Connection email not found for user ${connectionUserId}`);
  }
  
  const reviewUrl = `https://dmkxtkvlispxeqfzlczr.supabase.co/auto-gifting/review?utm_source=birthday_email`;
  
  const emailHtml = buildConnectionWithAutogiftEmail({
    recipientName: connectionProfile.first_name || connectionProfile.name || 'Friend',
    birthdayUserName,
    birthdayDate,
    daysUntil,
    selectedGift,
    reviewUrl
  });
  
  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [connectionProfile.email],
    subject: `Good news! Your gift for ${birthdayUserName} is all set 🎁`,
    html: emailHtml
  });
  
  console.log(`✅ Auto-gift confirmation sent to ${connectionProfile.email}`);
  
  return { emailSent: true, messageId: emailResponse.data?.id };
}

function buildConnectionWithAutogiftEmail(props: any) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
...
</body>
</html>
  `;
}

async function handleGiftPurchasedNotification(supabase: any, customData: any) {
  const {
    recipient_id,
    giftor_name,
    occasion,
    expected_delivery_date,
    gift_message,
    order_number
  } = customData;

  console.log(`🎁 Processing gift notification for recipient ${recipient_id}`);

  // Fetch recipient profile
  const { data: recipientProfile, error: profileError } = await supabase
    .from('profiles')
    .select('email, first_name, name')
    .eq('id', recipient_id)
    .maybeSingle();

  if (profileError || !recipientProfile) {
    console.error('Recipient profile not found:', profileError?.message);
    throw new Error(`Recipient profile not found for ${recipient_id}`);
  }

  if (!recipientProfile.email) {
    console.error('Recipient email not found');
    throw new Error(`Recipient email not found for user ${recipient_id}`);
  }

  // Check email preferences - respect opt-outs
  const { data: emailPrefs } = await supabase
    .from('email_preferences')
    .select('is_enabled')
    .eq('user_id', recipient_id)
    .eq('email_type', 'gift_notifications')
    .maybeSingle();

  if (emailPrefs && !emailPrefs.is_enabled) {
    console.log(`📧 Gift notification disabled for user ${recipient_id}`);
    return { skipped: true, reason: 'user_opted_out' };
  }

  // Import template
  const { giftPurchasedNotificationTemplate } = await import('./email-templates/gift-purchased-notification.ts');

  const recipientFirstName = recipientProfile.first_name || recipientProfile.name || 'Friend';

  // Generate email HTML
  const emailHtml = giftPurchasedNotificationTemplate({
    recipient_first_name: recipientFirstName,
    giftor_name: giftor_name || 'A friend',
    occasion: occasion || 'special occasion',
    expected_delivery_date,
    gift_message,
    order_number
  });

  // Send email via Resend
  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [recipientProfile.email],
    subject: `🎁 ${giftor_name} just sent you a gift for your ${occasion}!`,
    html: emailHtml
  });

  console.log(`✅ Gift notification sent to ${recipientProfile.email}`);

  // Log email analytics
  await supabase
    .from('email_analytics')
    .insert({
      email_type: 'gift_purchased_notification',
      recipient_id: recipient_id,
      sent_at: new Date().toISOString(),
      resend_message_id: emailResponse.data?.id
    });

  return { emailSent: true, messageId: emailResponse.data?.id };
}

/**
 * Handle wishlist item purchased notification
 * Notify wishlist owner that someone bought an item from their wishlist
 */
async function handleWishlistItemPurchased(supabase: any, customData: any) {
  const { wishlistId, itemId, itemName, itemImage, itemPrice, purchaserName, purchaserUserId } = customData;
  
  console.log(`📧 Sending wishlist item purchased notification for item ${itemId}`);
  
  // Get wishlist owner info
  const { data: wishlist, error: wishlistError } = await supabase
    .from('wishlists')
    .select('user_id, title')
    .eq('id', wishlistId)
    .single();
  
  if (wishlistError || !wishlist) {
    throw new Error(`Wishlist not found: ${wishlistId}`);
  }
  
  // Get owner profile
  const { data: ownerProfile, error: ownerError } = await supabase
    .from('profiles')
    .select('email, first_name, name')
    .eq('id', wishlist.user_id)
    .single();
  
  if (ownerError || !ownerProfile || !ownerProfile.email) {
    throw new Error(`Wishlist owner profile not found for user ${wishlist.user_id}`);
  }
  
  const ownerFirstName = ownerProfile.first_name || ownerProfile.name || 'there';
  const wishlistUrl = `https://elyphant.ai/wishlist/${wishlistId}`;
  
  // Build email HTML
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gift Purchased from Your Wishlist</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 32px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎁 Great News!</h1>
                  <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Someone bought you a gift from your wishlist</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                    Hi ${ownerFirstName},
                  </p>
                  
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                    ${purchaserName ? `<strong>${purchaserName}</strong> just` : 'Someone just'} purchased an item from your wishlist "<strong>${wishlist.title}</strong>"!
                  </p>
                  
                  ${itemImage ? `
                  <div style="text-align: center; margin: 32px 0;">
                    <img src="${itemImage}" alt="${itemName}" style="max-width: 200px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                  </div>
                  ` : ''}
                  
                  <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                    <h3 style="margin: 0 0 12px; font-size: 18px; color: #111827;">Item Purchased:</h3>
                    <p style="margin: 0 0 8px; font-size: 16px; color: #374151;"><strong>${itemName}</strong></p>
                    ${itemPrice ? `<p style="margin: 0; font-size: 16px; color: #6B7280;">Price: $${Number(itemPrice).toFixed(2)}</p>` : ''}
                  </div>
                  
                  <p style="margin: 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                    Your gift is on its way! You'll receive a shipping notification once it's dispatched.
                  </p>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${wishlistUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View Your Wishlist
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280;">
                    Happy gifting! 🎉
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                    © ${new Date().getFullYear()} Elyphant. All rights reserved.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  // Send email
  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [ownerProfile.email],
    subject: `🎁 Someone bought "${itemName}" from your wishlist!`,
    html: emailHtml
  });
  
  console.log(`✅ Wishlist purchase notification sent to ${ownerProfile.email}`);
  
  return { emailSent: true, messageId: emailResponse.data?.id };
}

/**
 * Handle wishlist purchase confirmation
 * Confirm to the gifter that their wishlist item purchase was successful
 */
async function handleWishlistPurchaseConfirmation(supabase: any, customData: any) {
  const { purchaserEmail, purchaserName, itemName, recipientName, orderNumber } = customData;
  
  console.log(`📧 Sending wishlist purchase confirmation to ${purchaserEmail}`);
  
  if (!purchaserEmail) {
    throw new Error('Purchaser email required');
  }
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wishlist Gift Purchase Confirmed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <tr>
                <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 32px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✅ Purchase Confirmed!</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                    Hi ${purchaserName || 'there'},
                  </p>
                  
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                    Thank you for purchasing <strong>${itemName}</strong> from ${recipientName ? `${recipientName}'s` : 'a'} wishlist! Your thoughtful gift is being prepared for shipment.
                  </p>
                  
                  ${orderNumber ? `
                  <div style="background-color: #f0fdf4; border-left: 4px solid #10B981; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0; font-size: 14px; color: #065f46;">
                      <strong>Order Number:</strong> ${orderNumber}
                    </p>
                  </div>
                  ` : ''}
                  
                  <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6; color: #374151;">
                    You'll receive a shipping confirmation email once your gift is on its way. ${recipientName ? `We've notified ${recipientName} that a gift is coming!` : ''}
                  </p>
                </td>
              </tr>
              
              <tr>
                <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                    © ${new Date().getFullYear()} Elyphant. All rights reserved.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [purchaserEmail],
    subject: `✅ Gift Purchase Confirmed - ${itemName}`,
    html: emailHtml
  });
  
  console.log(`✅ Purchase confirmation sent to ${purchaserEmail}`);
  
  return { emailSent: true, messageId: emailResponse.data?.id };
}

/**
 * Handle wishlist weekly summary
 * Send weekly digest of wishlist activity
 */
async function handleWishlistWeeklySummary(supabase: any, customData: any) {
  const { userId, weekStart, weekEnd } = customData;
  
  console.log(`📧 Generating wishlist weekly summary for user ${userId}`);
  
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, first_name, name')
    .eq('id', userId)
    .single();
  
  if (profileError || !profile || !profile.email) {
    throw new Error(`User profile not found: ${userId}`);
  }
  
  // Get wishlist activity for the week
  const { data: purchases, error: purchasesError } = await supabase
    .from('wishlist_item_purchases')
    .select(`
      *,
      wishlists!inner(title, user_id),
      wishlist_items!inner(title, price, image_url)
    `)
    .eq('wishlists.user_id', userId)
    .gte('created_at', weekStart)
    .lte('created_at', weekEnd);
  
  if (purchasesError) {
    console.error('Failed to fetch purchases:', purchasesError);
  }
  
  const purchaseCount = purchases?.length || 0;
  
  // Only send if there's activity
  if (purchaseCount === 0) {
    console.log(`No wishlist activity for user ${userId} this week`);
    return { skipped: true, reason: 'no_activity' };
  }
  
  const firstName = profile.first_name || profile.name || 'there';
  
  const purchaseRows = (purchases || []).map((p: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${p.wishlist_items?.title || 'Item'}</strong><br/>
        <span style="color: #6B7280; font-size: 14px;">from "${p.wishlists?.title || 'Wishlist'}"</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${new Date(p.created_at).toLocaleDateString()}
      </td>
    </tr>
  `).join('');
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Weekly Wishlist Summary</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <tr>
                <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 32px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">📊 Your Weekly Wishlist Summary</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                    Hi ${firstName},
                  </p>
                  
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                    Here's your wishlist activity for the week:
                  </p>
                  
                  <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
                    <h2 style="margin: 0; font-size: 36px; color: #10B981;">${purchaseCount}</h2>
                    <p style="margin: 8px 0 0; font-size: 16px; color: #065f46;">
                      ${purchaseCount === 1 ? 'item purchased' : 'items purchased'}
                    </p>
                  </div>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                    ${purchaseRows}
                  </table>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://elyphant.ai/wishlists" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View All Wishlists
                    </a>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                    © ${new Date().getFullYear()} Elyphant. All rights reserved.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [profile.email],
    subject: `📊 Your Wishlist Weekly Summary - ${purchaseCount} ${purchaseCount === 1 ? 'item' : 'items'} purchased`,
    html: emailHtml
  });
  
  console.log(`✅ Weekly summary sent to ${profile.email}`);
  
  return { emailSent: true, messageId: emailResponse.data?.id, purchaseCount };
}

serve(handler);
  await supabase.from('email_analytics').insert({
    template_type: 'gift_purchased_notification',
    recipient_email: recipientProfile.email,
    resend_message_id: emailResponse.data?.id,
    delivery_status: 'sent',
    sent_at: new Date().toISOString()
  });

  return { emailSent: true, messageId: emailResponse.data?.id };
}

serve(handler);