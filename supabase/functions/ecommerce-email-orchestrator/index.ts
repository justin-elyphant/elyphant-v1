// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.1.0";
import { extractFirstName } from './utils/name-helpers.ts';

// Import consolidated email templates
import {
  // Core E-Commerce
  orderConfirmationTemplate,
  orderStatusUpdateTemplate,
  orderCancelledTemplate,
  cartAbandonedTemplate,
  postPurchaseFollowupTemplate,
  
  // Gifting Core
  giftInvitationTemplate,
  autoGiftApprovalTemplate,
  autoGiftRuleCreatedTemplate,
  autoGiftRuleActivatedTemplate,
  giftPurchasedNotificationTemplate,
  
  // Social/Connections
  connectionInvitationTemplate,
  connectionEstablishedTemplate,
  nudgeReminderTemplate,
  
  // Onboarding & Engagement
  welcomeEmailConsolidatedTemplate,
  birthdayReminderConsolidatedTemplate,
  
  // Wishlist
  wishlistPurchaseNotificationTemplate
} from './email-templates/index.ts';

import type {
  OrderConfirmationProps,
  OrderStatusUpdateProps,
  OrderCancelledProps,
  CartAbandonedProps,
  PostPurchaseFollowupProps,
  GiftInvitationProps,
  AutoGiftApprovalProps,
  AutoGiftRuleCreatedProps,
  AutoGiftRuleActivatedProps,
  GiftPurchasedNotificationProps,
  ConnectionInvitationProps,
  ConnectionEstablishedProps,
  NudgeReminderProps,
  WelcomeEmailConsolidatedProps,
  BirthdayReminderProps,
  WishlistPurchaseNotificationProps
} from './email-templates/index.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Resend client
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface EmailRequest {
  eventType: 
    // Core E-Commerce (5)
    | 'order_confirmation'
    | 'order_status_update'
    | 'order_cancelled'
    | 'cart_abandoned'
    | 'post_purchase_followup'
    // Gifting Core (5)
    | 'gift_invitation'
    | 'auto_gift_approval'
    | 'auto_gift_rule_created'
    | 'auto_gift_rule_activated'
    | 'gift_received_notification'
    // Auto-Gift Payment Flow (5) - NEW
    | 'payment_method_expiring'
    | 'payment_method_invalid'
    | 'auto_gift_payment_retrying'
    | 'auto_gift_payment_retry_success'
    | 'auto_gift_payment_failed_final'
    | 'auto_gift_fulfillment_failed'
    // Social/Connections (3)
    | 'connection_invitation'
    | 'connection_established'
    | 'nudge_reminder'
    // Onboarding & Engagement (2)
    | 'welcome_email'
    | 'birthday_reminder'
    // Wishlist (1)
    | 'wishlist_purchase_notification'
    // Operational (kept for backward compatibility)
    | 'address_request'
    | 'address_collected_notification'
    | 'auto_gift_scheduled';
  data: any;
  recipientEmail?: string; // Optional: For testing, overrides DB lookup
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    // Support both camelCase and snake_case for backward compatibility
    const eventType = requestBody.eventType ?? requestBody.event_type;
    const recipientEmail = requestBody.recipientEmail ?? requestBody.recipient_email;
    // Support both 'data' and 'customData' for backward compatibility
    const data = requestBody.data ?? requestBody.customData ?? {};
    
    console.log(`📧 Processing email event: ${eventType}`);
    console.log(`📦 Payload keys: ${Object.keys(requestBody).join(', ')}`);
    console.log(`📦 Data keys: ${Object.keys(data).join(', ')}`);

    // Create Supabase client with service role for full access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let emailData;
    
    switch (eventType) {
      // Core E-Commerce
      case 'order_confirmation':
        emailData = await handleOrderConfirmation(supabase, data, recipientEmail);
        break;
      case 'order_status_update':
        emailData = await handleOrderStatusUpdate(supabase, data, recipientEmail);
        break;
      case 'order_cancelled':
        emailData = await handleOrderCancelled(supabase, data, recipientEmail);
        break;
      case 'cart_abandoned':
        emailData = await handleCartAbandoned(supabase, data, recipientEmail);
        break;
      case 'post_purchase_followup':
        emailData = await handlePostPurchaseFollowup(supabase, data, recipientEmail);
        break;
      
      // Gifting Core
      case 'gift_invitation':
        emailData = await handleGiftInvitation(supabase, data, recipientEmail);
        break;
      case 'auto_gift_approval':
        emailData = await handleAutoGiftApproval(supabase, data, recipientEmail);
        break;
      case 'auto_gift_rule_created':
        emailData = await handleAutoGiftRuleCreated(supabase, data, recipientEmail);
        break;
      case 'auto_gift_rule_activated':
        emailData = await handleAutoGiftRuleActivated(supabase, data, recipientEmail);
        break;
      case 'gift_received_notification':
        emailData = await handleGiftReceivedNotification(supabase, data, recipientEmail);
        break;
      
      // Auto-Gift Payment Flow (NEW)
      case 'payment_method_expiring':
        emailData = await handlePaymentMethodExpiring(supabase, data, recipientEmail);
        break;
      case 'payment_method_invalid':
        emailData = await handlePaymentMethodInvalid(supabase, data, recipientEmail);
        break;
      case 'auto_gift_payment_retrying':
        emailData = await handleAutoGiftPaymentRetrying(supabase, data, recipientEmail);
        break;
      case 'auto_gift_payment_retry_success':
        emailData = await handleAutoGiftPaymentRetrySuccess(supabase, data, recipientEmail);
        break;
      case 'auto_gift_payment_failed_final':
        emailData = await handleAutoGiftPaymentFailedFinal(supabase, data, recipientEmail);
        break;
      case 'auto_gift_fulfillment_failed':
        emailData = await handleAutoGiftFulfillmentFailed(supabase, data, recipientEmail);
        break;
      
      // Social/Connections
      case 'connection_invitation':
        emailData = await handleConnectionInvitation(supabase, data, recipientEmail);
        break;
      case 'connection_established':
        emailData = await handleConnectionEstablished(supabase, data, recipientEmail);
        break;
      case 'nudge_reminder':
        emailData = await handleNudgeReminder(supabase, data, recipientEmail);
        break;
      
      // Onboarding & Engagement
      case 'welcome_email':
        emailData = await handleWelcomeEmail(supabase, data, recipientEmail);
        break;
      case 'birthday_reminder':
        emailData = await handleBirthdayReminder(supabase, data, recipientEmail);
        break;
      
      // Wishlist
      case 'wishlist_purchase_notification':
        emailData = await handleWishlistPurchaseNotification(supabase, data, recipientEmail);
        break;
      
      // Operational (legacy support)
      case 'address_request':
        emailData = await handleAddressRequest(supabase, data, recipientEmail);
        break;
      
      case 'address_collected_notification':
        emailData = await handleAddressCollected(supabase, data, recipientEmail);
        break;
      
      case 'auto_gift_scheduled':
        emailData = await handleAutoGiftScheduled(supabase, data, recipientEmail);
        break;
      
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Elyphant <hello@elyphant.ai>",
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    });

    console.log(`✅ Email sent successfully: ${eventType}`);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      eventType 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Error in ecommerce-email-orchestrator:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process email event" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

// =============================================================================
// HANDLER FUNCTIONS - Each returns {to, subject, html}
// =============================================================================

/**
 * Handler: Order Confirmation
 */
async function handleOrderConfirmation(supabase: any, data: any, recipientEmail?: string) {
  console.log('📦 Handling order confirmation email');
  
  // If no recipientEmail provided, fetch from database
  if (!recipientEmail) {
    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', data.orderId || data.order_id)
      .single();

    if (order?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', order.user_id)
        .single();
      recipientEmail = profile?.email;
    }

    if (!recipientEmail) throw new Error('Could not find recipient email for order');
  }
  
  const emailHtml = orderConfirmationTemplate(data);

  return {
    to: recipientEmail,
    subject: `Order Confirmed! 🎉 Order #${data.order_number}`,
    html: emailHtml,
  };
}

/**
 * Handler: Order Status Update
 */
async function handleOrderStatusUpdate(supabase: any, data: any, recipientEmail?: string) {
  console.log('📦 Handling order status update email');
  
  // Fetch complete order data from database
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      tracking_number,
      merchant_tracking_data,
      delivery_dates,
      user_id
    `)
    .eq('id', data.orderId || data.order_id)
    .single();
  
  if (orderError || !order) {
    throw new Error(`Could not find order: ${orderError?.message || 'Order not found'}`);
  }
  
  // Fetch profile separately (no FK join available)
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name')
    .eq('id', order.user_id)
    .single();
  
  // Use provided recipientEmail or get from profile
  const emailTo = recipientEmail || profile?.email;
  if (!emailTo) throw new Error('Could not find recipient email for order');
  
  // Extract tracking URL from merchant_tracking_data
  let trackingUrl = null;
  if (order.merchant_tracking_data?.merchant_order_ids?.[0]?.tracking_url) {
    trackingUrl = order.merchant_tracking_data.merchant_order_ids[0].tracking_url;
  }
  
  // Format expected delivery date from delivery_dates if available
  let expectedDelivery = null;
  if (order.delivery_dates?.guarantee) {
    const deliveryDate = new Date(order.delivery_dates.guarantee);
    expectedDelivery = deliveryDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  // Transform data into format expected by email template
  const templateData: OrderStatusUpdateProps = {
    first_name: profile?.first_name || 'there',
    order_number: order.order_number,
    status: data.newStatus || data.status,
    tracking_number: order.tracking_number || null,
    tracking_url: trackingUrl,
    expected_delivery: expectedDelivery
  };
  
  console.log('📦 Order status update data:', {
    orderId: order.id,
    orderNumber: order.order_number,
    status: templateData.status,
    hasTrackingNumber: !!templateData.tracking_number,
    hasTrackingUrl: !!templateData.tracking_url,
    hasExpectedDelivery: !!templateData.expected_delivery
  });
  
  const emailHtml = orderStatusUpdateTemplate(templateData);
  
  const statusTitles = {
    'processing': 'Order Processing',
    'shipped': 'Order Shipped',
    'delivered': 'Order Delivered',
    'confirmed': 'Order Confirmed'
  };

  return {
    to: emailTo,
    subject: `${statusTitles[templateData.status as keyof typeof statusTitles] || 'Order Update'} - #${order.order_number}`,
    html: emailHtml,
  };
}

/**
 * Handler: Order Cancelled
 */
async function handleOrderCancelled(supabase: any, data: any, recipientEmail?: string) {
  console.log('🚫 Handling order cancellation email');

  const orderId = data.orderId || data.order_id;

  // If we have an orderId, fetch from DB; otherwise treat as test mode and use provided data
  if (orderId) {
    // Fetch complete order data from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        user_id
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Could not find order: ${orderError?.message || 'Order not found'}`);
    }

    // Fetch profile separately (no FK join available)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', order.user_id)
      .single();

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_name, price, quantity')
      .eq('order_id', order.id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
    }

    // Use provided recipientEmail or get from profile
    const emailTo = recipientEmail || profile?.email;
    if (!emailTo) throw new Error('Could not find recipient email for order');

    // Transform data into format expected by email template
    const templateData: OrderCancelledProps = {
      first_name: profile?.first_name || 'there',
      order_number: order.order_number,
      order_items: (orderItems || []).map(item => ({
        name: item.product_name,
        price: item.price,
        quantity: item.quantity
      })),
      refund_amount: order.total_amount,
      refund_timeline: '5-10 business days',
      cancellation_reason: data.cancellation_reason || data.reason,
      support_url: 'https://elyphant.com/support'
    };

    console.log('🚫 Order cancellation data (DB mode):', {
      orderId: order.id,
      orderNumber: order.order_number,
      itemCount: templateData.order_items.length,
      refundAmount: templateData.refund_amount,
      hasCancellationReason: !!templateData.cancellation_reason
    });

    const emailHtml = orderCancelledTemplate(templateData);

    return {
      to: emailTo,
      subject: `Order Cancelled - Refund Processing for #${order.order_number}`,
      html: emailHtml,
    };
  }

  // TEST MODE: no orderId provided, build email directly from data
  console.log('🧪 Order cancellation in test mode (no orderId provided)');

  const emailTo = recipientEmail || data.recipient_email || data.recipientEmail;
  if (!emailTo) throw new Error('Recipient email is required when no orderId is provided');

  const rawItems = Array.isArray(data.order_items)
    ? data.order_items
    : Array.isArray(data.items)
      ? data.items
      : [];

  const normalizedItems = rawItems.filter(Boolean).map((item: any) => ({
    name: item.name || item.title || item.product_name || 'Item',
    price: Number(item.price ?? item.unit_price ?? 0),
    quantity: Number(item.quantity ?? 1),
  }));

  const templateData: OrderCancelledProps = {
    first_name: data.first_name || data.firstName || 'there',
    order_number: data.order_number || data.orderNumber || 'TEST-ORDER',
    order_items: normalizedItems,
    refund_amount: Number(data.refund_amount ?? data.refundAmount ?? 0),
    refund_timeline: data.refund_timeline || data.refundTimeline || '5-10 business days',
    cancellation_reason: data.cancellation_reason || data.reason,
    support_url: data.support_url || 'https://elyphant.com/support',
  };

  console.log('🧪 Order cancellation data (test mode):', {
    orderNumber: templateData.order_number,
    itemCount: templateData.order_items.length,
    refundAmount: templateData.refund_amount,
  });

  const emailHtml = orderCancelledTemplate(templateData);

  return {
    to: emailTo,
    subject: `Order Cancelled - Refund Processing for #${templateData.order_number}`,
    html: emailHtml,
  };
}

/**
 * Handler: Cart Abandoned
 */
async function handleCartAbandoned(supabase: any, data: any, recipientEmail?: string) {
  console.log('🛒 Handling cart abandoned email');
  
  // If no recipientEmail provided, fetch from database
  if (!recipientEmail) {
    const { data: cart } = await supabase
      .from('cart_sessions')
      .select('user_id')
      .eq('id', data.cartSessionId || data.cart_session_id)
      .single();
    
    if (cart?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', cart.user_id)
        .single();
      recipientEmail = profile?.email;
    }
    
    if (!recipientEmail) throw new Error('Could not find recipient email for cart');
  }
  
  const emailHtml = cartAbandonedTemplate(data);

  return {
    to: recipientEmail,
    subject: 'You left items in your cart! 🛒',
    html: emailHtml,
  };
}

/**
 * Handler: Post Purchase Followup
 */
async function handlePostPurchaseFollowup(supabase: any, data: any, recipientEmail?: string) {
  console.log('⭐ Handling post-purchase followup email');
  
  // If no recipientEmail provided, fetch from database
  if (!recipientEmail) {
    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', data.orderId || data.order_id)
      .single();
    
    if (order?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', order.user_id)
        .single();
      recipientEmail = profile?.email;
    }
    
    if (!recipientEmail) throw new Error('Could not find recipient email for order');
  }
  
  const emailHtml = postPurchaseFollowupTemplate(data);

  return {
    to: recipientEmail,
    subject: `How was your recent order? We'd love your feedback!`,
    html: emailHtml,
  };
}

/**
 * Handler: Gift Invitation
 * Handles both simple gift invitations and gift+connection requests
 */
async function handleGiftInvitation(supabase: any, data: any, recipientEmail?: string) {
  console.log('🎁 Handling gift invitation email');
  
  // recipientEmail must be provided for gift invitations (external recipients)
  if (!recipientEmail) {
    recipientEmail = data.recipient_email || data.recipientEmail;
    if (!recipientEmail) throw new Error('Recipient email required for gift invitation');
  }
  
  // Construct the invitation acceptance URL
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const invitationUrl = `${supabaseUrl}/functions/v1/handle-invitation-acceptance?invitation_id=${data.invitationId || data.invitation_id}`;
  
  // Pass the invitation URL to the template
  const emailHtml = giftInvitationTemplate({
    ...data,
    invitation_url: invitationUrl
  });
  
  const subjectPrefix = data.occasion ? `Gift for ${data.occasion}` : 'Gift Invitation';

  return {
    to: recipientEmail,
    subject: `${data.sender_first_name} sent you a ${subjectPrefix}! 🎁`,
    html: emailHtml,
  };
}

/**
 * Handler: Auto Gift Approval
 */
async function handleAutoGiftApproval(supabase: any, data: any, recipientEmail?: string) {
  console.log('✅ Handling auto-gift approval email');
  
  // If no recipientEmail provided, fetch from user who set up the auto-gift
  if (!recipientEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId || data.user_id)
      .single();
    
    recipientEmail = profile?.email;
    if (!recipientEmail) throw new Error('Could not find recipient email for auto-gift approval');
  }
  
  // Normalize suggested_gifts format - handle both array and single gift
  let suggested_gifts = data.suggested_gifts;
  if (!suggested_gifts && data.suggested_gift) {
    // Convert single gift to array format
    suggested_gifts = [{
      name: data.suggested_gift,
      price: data.gift_price || 'TBD',
      image_url: data.gift_image_url
    }];
  } else if (!Array.isArray(suggested_gifts)) {
    suggested_gifts = [];
  }
  
  const emailHtml = autoGiftApprovalTemplate({
    ...data,
    suggested_gifts
  });

  return {
    to: recipientEmail,
    subject: `Auto-Gift Approval Needed for ${data.recipient_name}`,
    html: emailHtml,
  };
}

/**
 * Handler: Gift Received Notification
 */
async function handleGiftReceivedNotification(supabase: any, data: any, recipientEmail?: string) {
  console.log('🎁 Handling gift received notification email');
  
  // Extract email with multiple fallbacks
  const emailTo = recipientEmail || data?.recipient_email || data?.recipientEmail;
  
  if (!emailTo) {
    console.error('❌ Missing recipient email. Data:', JSON.stringify(data));
    throw new Error('Recipient email required for gift notification');
  }
  
  const giftorName = data?.giftor_name || data?.giftorName || 'Someone';
  
  const emailHtml = giftPurchasedNotificationTemplate({
    ...data,
    giftor_name: giftorName
  });

  return {
    to: emailTo,
    subject: `${giftorName} sent you a gift! 🎁`,
    html: emailHtml,
  };
}

/**
 * Handler: Auto-Gift Rule Created
 */
async function handleAutoGiftRuleCreated(supabase: any, data: any, recipientEmail?: string) {
  console.log('🎁 Handling auto-gift rule created email');
  
  const emailTo = recipientEmail || data?.user_email || data?.userEmail;
  
  if (!emailTo) {
    console.error('❌ Missing user email. Data:', JSON.stringify(data));
    throw new Error('User email required for auto-gift rule created notification');
  }
  
  const fullName = data.recipient_name || data.recipientName;
  const firstName = extractFirstName(fullName);
  
  const emailHtml = autoGiftRuleCreatedTemplate({
    recipient_name: fullName,
    recipient_first_name: firstName,
    recipient_email: data.recipient_email || data.recipientEmail,
    rule_details: {
      occasion: data.occasion || data.rule_details?.occasion || 'Special Occasion',
      budget_limit: data.budget_limit || data.rule_details?.budget_limit,
      is_recurring: data.is_recurring ?? data.rule_details?.is_recurring ?? false,
      next_event_date: data.next_event_date || data.rule_details?.next_event_date
    },
    auto_approve_enabled: data.auto_approve_enabled ?? data.autoApproveEnabled ?? false
  });

  return {
    to: emailTo,
    subject: `Auto-Gift Rule Created for ${firstName} 🎁`,
    html: emailHtml,
  };
}

/**
 * Handler: Auto-Gift Rule Activated
 */
async function handleAutoGiftRuleActivated(supabase: any, data: any, recipientEmail?: string) {
  console.log('✅ Handling auto-gift rule activated email');
  
  const emailTo = recipientEmail || data?.user_email || data?.userEmail;
  
  if (!emailTo) {
    console.error('❌ Missing user email. Data:', JSON.stringify(data));
    throw new Error('User email required for auto-gift rule activated notification');
  }
  
  const fullName = data.recipient_name || data.recipientName;
  const firstName = extractFirstName(fullName);
  
  const emailHtml = autoGiftRuleActivatedTemplate({
    recipient_name: fullName,
    recipient_first_name: firstName,
    recipient_email: data.recipient_email || data.recipientEmail,
    rule_details: {
      occasion: data.occasion || data.rule_details?.occasion || 'Special Occasion',
      budget_limit: data.budget_limit || data.rule_details?.budget_limit,
      is_recurring: data.is_recurring ?? data.rule_details?.is_recurring ?? false,
      next_event_date: data.next_event_date || data.rule_details?.next_event_date
    },
    auto_approve_enabled: data.auto_approve_enabled ?? data.autoApproveEnabled ?? false
  });

  return {
    to: emailTo,
    subject: `Auto-Gift Rule Activated! ${firstName} is ready 🎉`,
    html: emailHtml,
  };
}


/**
 * Handler: Connection Invitation
 */
async function handleConnectionInvitation(supabase: any, data: any, recipientEmail?: string) {
  console.log('👥 Handling connection invitation email');
  console.log('👥 Data received:', JSON.stringify(data, null, 2));
  console.log('👥 RecipientEmail param:', recipientEmail);
  
  // Extract email with multiple fallbacks
  const emailTo = recipientEmail || data?.recipient_email || data?.recipientEmail;
  
  console.log('👥 Resolved emailTo:', emailTo);
  
  if (!emailTo) {
    console.error('❌ Missing recipient email. Data:', JSON.stringify(data));
    throw new Error('Recipient email required for connection invitation');
  }
  
  // Safely extract other required fields
  const senderName = data?.sender_name || data?.senderName || 'Someone';
  const invitationUrl = data?.invitation_url || data?.invitationUrl || '';
  const fullRecipientName = data?.recipient_name || data?.recipientName || '';
  const recipientFirstName = extractFirstName(fullRecipientName);
  
  const emailHtml = connectionInvitationTemplate({
    ...data,
    sender_name: senderName,
    recipient_name: fullRecipientName,
    recipient_first_name: recipientFirstName,
    invitation_url: invitationUrl
  });

  return {
    to: emailTo,
    subject: `${recipientFirstName}, ${senderName} wants to connect on Elyphant 💝`,
    html: emailHtml,
  };
}

/**
 * Handler: Connection Established
 * Sent to both parties when connection is accepted
 */
async function handleConnectionEstablished(supabase: any, data: any, recipientEmail?: string) {
  console.log('🎉 Handling connection established email');
  
  // If no recipientEmail provided, fetch from user_id
  if (!recipientEmail) {
    const userId = data?.userId || data?.user_id;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      recipientEmail = profile?.email;
    }
    
    if (!recipientEmail) {
      console.error('❌ Could not find recipient email. Data:', JSON.stringify(data));
      throw new Error('Could not find recipient email for connection');
    }
  }
  
  const connectionName = data?.connection_name || data?.connectionName || 'your connection';
  
  const emailHtml = connectionEstablishedTemplate({
    ...data,
    connection_name: connectionName
  });

  return {
    to: recipientEmail,
    subject: `You're now connected with ${connectionName}! 🎉`,
    html: emailHtml,
  };
}

/**
 * Handler: Nudge Reminder
 * Sent to shopper when recipient hasn't accepted invitation after 7 days
 */
async function handleNudgeReminder(supabase: any, data: any, recipientEmail?: string) {
  console.log('📧 Handling nudge reminder email (shopper notification)');
  
  // If no recipientEmail provided, fetch from shopper_user_id
  if (!recipientEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name, first_name')
      .eq('id', data.shopper_user_id)
      .single();
    
    recipientEmail = profile?.email;
    if (!recipientEmail) throw new Error('Could not find shopper email for nudge reminder');
    
    // Add shopper name to data if not provided
    if (!data.shopper_name) {
      data.shopper_name = profile?.first_name || profile?.name || 'there';
    }
  }
  
  const emailHtml = nudgeReminderTemplate({
    shopper_name: data.shopper_name,
    recipient_name: data.recipient_name,
    recipient_email: data.recipient_email,
    days_since_invitation: data.days_since_invitation || 7,
    connections_url: 'https://elyphant.ai/connections'
  });

  return {
    to: recipientEmail,
    subject: `Connection Update: ${data.recipient_name} hasn't responded yet`,
    html: emailHtml,
  };
}

/**
 * Handler: Welcome Email
 * Smart welcome email with optional product suggestions
 */
async function handleWelcomeEmail(supabase: any, data: any, recipientEmail?: string) {
  console.log('👋 Handling welcome email');
  
  // If no recipientEmail provided, fetch from user_id
  if (!recipientEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId || data.user_id)
      .single();
    
    recipientEmail = profile?.email;
    if (!recipientEmail) throw new Error('Could not find recipient email for welcome');
  }
  
  const emailHtml = welcomeEmailConsolidatedTemplate(data);

  return {
    to: recipientEmail,
    subject: 'Welcome to Elyphant! 🎁',
    html: emailHtml,
  };
}

/**
 * Handler: Birthday Reminder
 * Handles all birthday contexts: self, connection with auto-gift, connection without auto-gift
 */
async function handleBirthdayReminder(supabase: any, data: any, recipientEmail?: string) {
  console.log('🎂 Handling birthday reminder email');
  
  // If no recipientEmail provided, fetch from user_id
  if (!recipientEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId || data.user_id)
      .single();
    
    recipientEmail = profile?.email;
    if (!recipientEmail) throw new Error('Could not find recipient email for birthday reminder');
  }
  
  // Construct profile URL for birthday person (for connection emails)
  const enrichedData = {
    ...data,
    recipient_profile_url: data.birthday_person_id 
      ? `https://elyphant.ai/profile/${data.birthday_person_id}`
      : data.recipient_profile_url
  };
  
  const emailHtml = birthdayReminderConsolidatedTemplate(enrichedData);
  
  const subjects = {
    'self': `Happy Birthday from Elyphant! 🎂`,
    'connection_with_autogift': `Good news! Your gift for ${data.recipient_name} is all set 🎁`,
    'connection_no_autogift': `${data.recipient_name}'s birthday is coming up! 🎂`
  };

  return {
    to: recipientEmail,
    subject: subjects[data.context] || `Birthday Reminder 🎂`,
    html: emailHtml,
  };
}

/**
 * Handler: Wishlist Purchase Notification
 * Consolidates: wishlist_item_purchased + wishlist_purchase_confirmation
 */
async function handleWishlistPurchaseNotification(supabase: any, data: any, recipientEmail?: string) {
  console.log('🎁 Handling wishlist purchase notification email');
  
  // If no recipientEmail provided, fetch based on notification type
  if (!recipientEmail) {
    const userId = data.notification_type === 'purchaser_confirmation' 
      ? data.purchaser_id || data.purchaserId
      : data.wishlist_owner_id || data.wishlistOwnerId;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    
    recipientEmail = profile?.email;
    if (!recipientEmail) throw new Error('Could not find recipient email for wishlist notification');
  }
  
  // Check if there's a connection between purchaser and wishlist owner (for thank you CTA)
  let hasConnection = false;
  const wishlistOwnerId = data.wishlist_owner_id || data.wishlistOwnerId;
  const purchaserUserId = data.purchaser_user_id || data.purchaserUserId;
  
  if (purchaserUserId && wishlistOwnerId) {
    const { data: connection } = await supabase
      .from('user_connections')
      .select('status')
      .or(`and(user_id.eq.${purchaserUserId},connected_user_id.eq.${wishlistOwnerId}),and(user_id.eq.${wishlistOwnerId},connected_user_id.eq.${purchaserUserId})`)
      .eq('status', 'accepted')
      .maybeSingle();
    
    hasConnection = !!connection;
    
    console.log(`🔍 Connection check: purchaser=${purchaserUserId}, owner=${wishlistOwnerId}, hasConnection=${hasConnection}`);
  }
  
  console.log(`🎁 Wishlist purchase notification - purchaser_user_id: ${data.purchaser_user_id}, has_connection: ${hasConnection}`);
  
  const enrichedData = {
    ...data,
    has_connection: hasConnection
  };
  
  const emailHtml = wishlistPurchaseNotificationTemplate(enrichedData);
  
  const subject = data.notification_type === 'purchaser_confirmation'
    ? `Gift Purchase Confirmed - ${data.product_name}`
    : `Someone bought ${data.product_name} from your wishlist! 🎁`;

  return {
    to: recipientEmail,
    subject: subject,
    html: emailHtml,
  };
}

// handleAddressRequest moved below - see line 1169 for implementation

// =============================================================================
// AUTO-GIFT PAYMENT FLOW HANDLERS (NEW)
// =============================================================================

/**
 * Handler: Payment Method Expiring (30 days before expiration)
 */
async function handlePaymentMethodExpiring(supabase: any, data: any, recipientEmail?: string) {
  console.log('💳 Handling payment method expiring notification');
  
  if (!recipientEmail && data.userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId)
      .single();
    recipientEmail = profile?.email;
  }
  
  if (!recipientEmail) throw new Error('Could not find recipient email');
  
  const emailHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #ff9800;">⚠️ Your Payment Method is Expiring Soon</h2>
        <p>Hi there,</p>
        <p>Your payment method for auto-gifting will expire in <strong>${data.daysRemaining || 30} days</strong> (${data.expirationDate}).</p>
        <p>To ensure uninterrupted auto-gifting, please update your payment method before it expires.</p>
        <p style="margin: 20px 0;">
          <a href="https://dmkxtkvlispxeqfzlczr.supabase.co/auto-gifts/settings" 
             style="background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Update Payment Method
          </a>
        </p>
        <p>Thank you for using Elyphant's Auto-Gifting!</p>
      </body>
    </html>
  `;

  return {
    to: recipientEmail,
    subject: '⚠️ Payment Method Expiring Soon - Update Required',
    html: emailHtml,
  };
}

/**
 * Handler: Payment Method Invalid (expired, detached, or failed validation)
 */
async function handlePaymentMethodInvalid(supabase: any, data: any, recipientEmail?: string) {
  console.log('❌ Handling payment method invalid notification');
  
  if (!recipientEmail && data.userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId)
      .single();
    recipientEmail = profile?.email;
  }
  
  if (!recipientEmail) throw new Error('Could not find recipient email');
  
  const statusMessages = {
    expired: 'Your payment method has expired',
    invalid: 'Your payment method is no longer valid',
    detached: 'Your payment method is no longer attached to your account',
  };
  
  const message = statusMessages[data.status] || 'There is an issue with your payment method';
  
  const emailHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #f44336;">❌ Action Required: Payment Method Issue</h2>
        <p>Hi there,</p>
        <p><strong>${message}.</strong></p>
        <p>Your auto-gifting is currently paused. Please update your payment method to resume automatic gift purchases.</p>
        ${data.errorMessage ? `<p style="color: #666;"><em>Details: ${data.errorMessage}</em></p>` : ''}
        <p style="margin: 20px 0;">
          <a href="https://dmkxtkvlispxeqfzlczr.supabase.co/auto-gifts/settings" 
             style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Update Payment Method Now
          </a>
        </p>
        <p>Thank you for your prompt attention!</p>
      </body>
    </html>
  `;

  return {
    to: recipientEmail,
    subject: '❌ Action Required: Update Your Payment Method',
    html: emailHtml,
  };
}

/**
 * Handler: Auto-Gift Payment Retrying
 */
async function handleAutoGiftPaymentRetrying(supabase: any, data: any, recipientEmail?: string) {
  console.log('🔄 Handling auto-gift payment retry notification');
  
  if (!recipientEmail && data.userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId)
      .single();
    recipientEmail = profile?.email;
  }
  
  if (!recipientEmail) throw new Error('Could not find recipient email');
  
  const nextRetryDate = data.nextRetryAt ? new Date(data.nextRetryAt).toLocaleString() : 'soon';
  
  const emailHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2196F3;">🔄 Auto-Gift Payment - We'll Try Again</h2>
        <p>Hi there,</p>
        <p>We encountered an issue processing your auto-gift payment (attempt ${data.retryCount || 1} of 3).</p>
        <p><strong>Don't worry - we'll automatically retry in a few hours.</strong></p>
        <p>Next retry: ${nextRetryDate}</p>
        ${data.errorMessage ? `<p style="color: #666;"><em>Reason: ${data.errorMessage}</em></p>` : ''}
        <p>If you'd like to update your payment method or check your auto-gift settings, you can do so anytime:</p>
        <p style="margin: 20px 0;">
          <a href="https://dmkxtkvlispxeqfzlczr.supabase.co/auto-gifts/settings" 
             style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Auto-Gift Settings
          </a>
        </p>
        <p>We'll keep you updated!</p>
      </body>
    </html>
  `;

  return {
    to: recipientEmail,
    subject: '🔄 Auto-Gift Payment - We\'ll Retry Soon',
    html: emailHtml,
  };
}

/**
 * Handler: Auto-Gift Payment Retry Success
 */
async function handleAutoGiftPaymentRetrySuccess(supabase: any, data: any, recipientEmail?: string) {
  console.log('✅ Handling auto-gift payment retry success notification');
  
  if (!recipientEmail && data.userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId)
      .single();
    recipientEmail = profile?.email;
  }
  
  if (!recipientEmail) throw new Error('Could not find recipient email');
  
  const emailHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">✅ Auto-Gift Payment Successful!</h2>
        <p>Hi there,</p>
        <p>Good news! Your auto-gift payment was successfully processed on retry attempt ${data.retryCount || 1}.</p>
        <p><strong>Your gift is now being prepared for delivery! 🎁</strong></p>
        <p>You can track your auto-gift orders anytime:</p>
        <p style="margin: 20px 0;">
          <a href="https://dmkxtkvlispxeqfzlczr.supabase.co/auto-gifts/executions" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Auto-Gift Orders
          </a>
        </p>
        <p>Thank you for using Elyphant!</p>
      </body>
    </html>
  `;

  return {
    to: recipientEmail,
    subject: '✅ Auto-Gift Payment Successful!',
    html: emailHtml,
  };
}

/**
 * Handler: Auto-Gift Payment Failed Final (after 3 retries)
 */
async function handleAutoGiftPaymentFailedFinal(supabase: any, data: any, recipientEmail?: string) {
  console.log('❌ Handling auto-gift payment final failure notification');
  
  if (!recipientEmail && data.userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId)
      .single();
    recipientEmail = profile?.email;
  }
  
  if (!recipientEmail) throw new Error('Could not find recipient email');
  
  const emailHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #f44336;">❌ Auto-Gift Payment Failed - Action Required</h2>
        <p>Hi there,</p>
        <p>We tried processing your auto-gift payment 3 times, but unfortunately all attempts failed.</p>
        <p><strong>Your gift order has been cancelled.</strong></p>
        ${data.errorMessage ? `<p style="color: #666;"><em>Reason: ${data.errorMessage}</em></p>` : ''}
        <p>To prevent this from happening again, please update your payment method:</p>
        <p style="margin: 20px 0;">
          <a href="https://dmkxtkvlispxeqfzlczr.supabase.co/auto-gifts/settings" 
             style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Update Payment Method
          </a>
        </p>
        <p>If you have questions, please don't hesitate to reach out to our support team.</p>
      </body>
    </html>
  `;

  return {
    to: recipientEmail,
    subject: '❌ Auto-Gift Payment Failed - Update Required',
    html: emailHtml,
  };
}

/**
 * Handler: Auto-Gift Fulfillment Failed (Zinc processing error)
 */
async function handleAutoGiftFulfillmentFailed(supabase: any, data: any, recipientEmail?: string) {
  console.log('📦 Handling auto-gift fulfillment failure notification');
  
  if (!recipientEmail && data.userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId)
      .single();
    recipientEmail = profile?.email;
  }
  
  if (!recipientEmail) throw new Error('Could not find recipient email');
  
  const emailHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #ff9800;">⚠️ Auto-Gift Order Issue</h2>
        <p>Hi there,</p>
        <p>Your payment was processed successfully, but we encountered an issue placing your auto-gift order with our retailer.</p>
        <p><strong>Don't worry - you have NOT been charged.</strong></p>
        ${data.errorMessage ? `<p style="color: #666;"><em>Details: ${data.errorMessage}</em></p>` : ''}
        <p>Our team has been notified and will resolve this issue. We'll reach out to you within 24 hours.</p>
        <p>If you have immediate questions, please contact our support team.</p>
        <p>We apologize for the inconvenience!</p>
      </body>
    </html>
  `;

  return {
    to: recipientEmail,
    subject: '⚠️ Auto-Gift Order Issue - We\'re On It',
    html: emailHtml,
  };
}

/**
 * Handler: Address Request (Legacy support)
 */
async function handleAddressRequest(supabase: any, data: any, recipientEmail?: string) {
  console.log('📬 Handling address request email');
  
  if (!recipientEmail) {
    recipientEmail = data.recipient_email || data.recipientEmail;
    if (!recipientEmail) throw new Error('Recipient email required for address request');
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #9333ea;">${data.requester_name} needs your address</h1>
      <p>Hi ${data.recipient_name},</p>
      <p>${data.requester_name} is requesting your shipping address${data.occasion ? ` for ${data.occasion}` : ''}.</p>
      ${data.message ? `<p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">${data.message}</p>` : ''}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.request_url}" style="background-color: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Share Your Address</a>
      </div>
    </body>
    </html>
  `;

  return {
    to: recipientEmail,
    subject: `${data.requester_name} requested your address`,
    html: html,
  };
}

/**
 * Handler: Address Collected Notification
 */
async function handleAddressCollected(supabase: any, data: any, recipientEmail?: string) {
  console.log('✅ Handling address collected notification');
  
  if (!recipientEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId)
      .single();
    recipientEmail = profile?.email;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #48bb78;">✅ Address Received!</h1>
      <p>Great news!</p>
      <p><strong>${data.recipientEmail}</strong> has shared their shipping address with you.</p>
      <p style="background: #f0fff4; padding: 15px; border-radius: 8px; border-left: 4px solid #48bb78;">
        Your auto-gift order will now be processed and sent to them at the scheduled time.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://dmkxtkvlispxeqfzlczr.supabase.co/gifting/auto-gifting" style="background-color: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">View Auto-Gifts</a>
      </div>
    </body>
    </html>
  `;

  return {
    to: recipientEmail,
    subject: '✅ Recipient Address Received',
    html: html,
  };
}

/**
 * Handler: Auto-Gift Scheduled Notification
 */
async function handleAutoGiftScheduled(supabase: any, data: any, recipientEmail?: string) {
  console.log('📅 Handling auto-gift scheduled notification');
  
  if (!recipientEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId)
      .single();
    recipientEmail = profile?.email;
  }
  
  const scheduledDate = new Date(data.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const eventDate = new Date(data.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #9333ea;">🎁 Auto-Gift Scheduled</h1>
      <p>Your auto-gift order <strong>#${data.orderNumber}</strong> has been successfully approved and scheduled!</p>
      
      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Delivery Schedule:</h3>
        <p style="margin: 5px 0;">📦 <strong>Order will be sent:</strong> ${scheduledDate}</p>
        <p style="margin: 5px 0;">🎉 <strong>For event on:</strong> ${eventDate}</p>
      </div>
      
      <p style="background: #edf2f7; padding: 15px; border-radius: 8px;">
        ℹ️ We're holding your order to ensure it arrives at the perfect time - about 2-3 days before the special occasion!
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://dmkxtkvlispxeqfzlczr.supabase.co/gifting/auto-gifting" style="background-color: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">View Order Details</a>
      </div>
    </body>
    </html>
  `;

  return {
    to: recipientEmail,
    subject: `🎁 Auto-Gift Scheduled - Order #${data.orderNumber}`,
    html: html,
  };
}

serve(handler);
