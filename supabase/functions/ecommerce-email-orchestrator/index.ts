// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.1.0";

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
  giftPurchasedNotificationTemplate,
  
  // Social/Connections
  connectionInvitationTemplate,
  connectionEstablishedTemplate,
  
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
  GiftPurchasedNotificationProps,
  ConnectionInvitationProps,
  ConnectionEstablishedProps,
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
    // Gifting Core (3)
    | 'gift_invitation'
    | 'auto_gift_approval'
    | 'gift_received_notification'
    // Social/Connections (2)
    | 'connection_invitation'
    | 'connection_established'
    // Onboarding & Engagement (2)
    | 'welcome_email'
    | 'birthday_reminder'
    // Wishlist (1)
    | 'wishlist_purchase_notification'
    // Operational (kept for backward compatibility)
    | 'address_request';
  data: any;
  recipientEmail?: string; // Optional: For testing, overrides DB lookup
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, data, recipientEmail }: EmailRequest = await req.json();
    
    console.log(`📧 Processing email event: ${eventType}`);

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
      case 'gift_received_notification':
        emailData = await handleGiftReceivedNotification(supabase, data, recipientEmail);
        break;
      
      // Social/Connections
      case 'connection_invitation':
        emailData = await handleConnectionInvitation(supabase, data, recipientEmail);
        break;
      case 'connection_established':
        emailData = await handleConnectionEstablished(supabase, data, recipientEmail);
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
  
  // recipientEmail must be provided or in data (external recipients)
  if (!recipientEmail) {
    recipientEmail = data.recipient_email || data.recipientEmail;
    if (!recipientEmail) throw new Error('Recipient email required for gift notification');
  }
  
  const emailHtml = giftPurchasedNotificationTemplate(data);

  return {
    to: recipientEmail,
    subject: `${data.giftor_name} sent you a gift! 🎁`,
    html: emailHtml,
  };
}

/**
 * Handler: Connection Invitation
 */
async function handleConnectionInvitation(supabase: any, data: any, recipientEmail?: string) {
  console.log('👥 Handling connection invitation email');
  
  // recipientEmail must be provided (external invitations)
  if (!recipientEmail) {
    recipientEmail = data.recipient_email || data.recipientEmail;
    if (!recipientEmail) throw new Error('Recipient email required for connection invitation');
  }
  
  const emailHtml = connectionInvitationTemplate(data);

  return {
    to: recipientEmail,
    subject: `${data.sender_name} wants to connect on Elyphant 💝`,
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId || data.user_id)
      .single();
    
    recipientEmail = profile?.email;
    if (!recipientEmail) throw new Error('Could not find recipient email for connection');
  }
  
  const emailHtml = connectionEstablishedTemplate(data);

  return {
    to: recipientEmail,
    subject: `You're now connected with ${data.connection_name}! 🎉`,
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
  
  const emailHtml = birthdayReminderConsolidatedTemplate(data);
  
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
  
  const emailHtml = wishlistPurchaseNotificationTemplate(data);
  
  const subject = data.notification_type === 'purchaser_confirmation'
    ? `Gift Purchase Confirmed - ${data.product_name}`
    : `Someone bought ${data.product_name} from your wishlist! 🎁`;

  return {
    to: recipientEmail,
    subject: subject,
    html: emailHtml,
  };
}

/**
 * Handler: Address Request (Legacy - operational necessity)
 */
async function handleAddressRequest(supabase: any, data: any, recipientEmail?: string) {
  console.log('📍 Handling address request email');
  
  // recipientEmail must be provided (external recipients)
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

serve(handler);
