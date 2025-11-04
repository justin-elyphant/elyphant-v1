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
      .select('user_id, profiles!inner(email)')
      .eq('id', data.orderId || data.order_id)
      .single();
    
    recipientEmail = order?.profiles?.email;
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
  
  // If no recipientEmail provided, fetch from database
  if (!recipientEmail) {
    const { data: order } = await supabase
      .from('orders')
      .select('user_id, profiles!inner(email)')
      .eq('id', data.orderId || data.order_id)
      .single();
    
    recipientEmail = order?.profiles?.email;
    if (!recipientEmail) throw new Error('Could not find recipient email for order');
  }
  
  const emailHtml = orderStatusUpdateTemplate(data);
  
  const statusTitles = {
    'processing': 'Order Processing',
    'shipped': 'Order Shipped',
    'delivered': 'Order Delivered',
    'confirmed': 'Order Confirmed'
  };

  return {
    to: recipientEmail,
    subject: `${statusTitles[data.new_status as keyof typeof statusTitles] || 'Order Update'} - #${data.order_number}`,
    html: emailHtml,
  };
}

/**
 * Handler: Order Cancelled
 */
async function handleOrderCancelled(supabase: any, data: any, recipientEmail?: string) {
  console.log('🚫 Handling order cancellation email');
  
  // If no recipientEmail provided, fetch from database
  if (!recipientEmail) {
    const { data: order } = await supabase
      .from('orders')
      .select('user_id, profiles!inner(email)')
      .eq('id', data.orderId || data.order_id)
      .single();
    
    recipientEmail = order?.profiles?.email;
    if (!recipientEmail) throw new Error('Could not find recipient email for order');
  }
  
  const emailHtml = orderCancelledTemplate(data);

  return {
    to: recipientEmail,
    subject: `Order Cancelled - Refund Processing for #${data.order_number}`,
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
      .select('user_id, profiles!inner(email)')
      .eq('id', data.cartSessionId || data.cart_session_id)
      .single();
    
    recipientEmail = cart?.profiles?.email;
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
      .select('user_id, profiles!inner(email)')
      .eq('id', data.orderId || data.order_id)
      .single();
    
    recipientEmail = order?.profiles?.email;
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
  
  const emailHtml = giftInvitationTemplate(data);
  
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
  
  const emailHtml = autoGiftApprovalTemplate(data);

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
    subject: `${data.sender_name} sent you a gift! 🎁`,
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
