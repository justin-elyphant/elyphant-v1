// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.1.0";
import { 
  orderConfirmationTemplate,
  paymentConfirmationTemplate,
  welcomeEmailTemplate,
  giftInvitationTemplate,
  autoGiftApprovalTemplate,
  orderStatusUpdateTemplate
} from './email-templates/index.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Resend client
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface EmailRequest {
  eventType: 
    | 'order_created' 
    | 'payment_confirmed' 
    | 'order_status_changed' 
    | 'order_cancelled' 
    | 'user_welcomed' 
    | 'cart_abandoned' 
    | 'post_purchase_followup' 
    | 'auto_gift_approval' 
    | 'gift_invitation'
    | 'connection_invitation'
    | 'password_reset'
    | 'password_changed'
    | 'account_deletion'
    | 'wishlist_welcome'
    | 'address_request'
    | 'nudge_reminder'
    | 'order_receipt';
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
      case 'payment_confirmed':
        result = await handlePaymentConfirmation(supabase, orderId!);
        break;
      case 'order_status_changed':
        result = await handleOrderStatusUpdate(supabase, orderId!, customData?.status);
        break;
      case 'order_cancelled':
        result = await handleOrderCancellation(supabase, orderId!);
        break;
      case 'user_welcomed':
        result = await handleWelcomeEmail(supabase, userId!);
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
      case 'connection_invitation':
        result = await handleConnectionInvitation(supabase, customData!);
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
      case 'order_receipt':
        result = await handleOrderReceipt(supabase, orderId!);
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
  // Get order details
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

// Profile will be fetched separately using order.user_id

  // Check if confirmation email already sent
  if (order.confirmation_email_sent) {
    console.log(`Order confirmation already sent for ${orderId}`);
    return { skipped: true, reason: 'already_sent' };
  }

  // Get order confirmation template - check if we have one or create a basic fallback
  let { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_type', 'order_confirmation')
    .eq('is_active', true)
    .single();

  // If no order_confirmation template exists, create a basic one
  if (!template) {
    const { data: newTemplate } = await supabase
      .from('email_templates')
      .insert({
        template_type: 'order_confirmation',
        name: 'Order Confirmation',
        subject_template: 'Order Confirmation - {{order_number}}',
        html_template: `
          <h1>Thank you for your order!</h1>
          <p>Dear {{customer_name}},</p>
          <p>We've received your order #{{order_number}} for \${{total_amount}}.</p>
          <p>Order Date: {{order_date}}</p>
          <p>Track your order: <a href="{{order_tracking_url}}">View Order</a></p>
          <p>Questions? Contact us at {{support_email}}</p>
        `,
        is_active: true,
        created_by: '0478a7d7-9d59-40bf-954e-657fa28fe251'
      })
      .select()
      .single();
    
    template = newTemplate;
  }

  if (!template) {
    throw new Error('Order confirmation template not found');
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

  // Parse order items from metadata
  const orderItems = order.order_metadata?.items || [];
  const formattedItems = orderItems.map((item: any) => ({
    name: item.name || 'Product',
    quantity: item.quantity || 1,
    price: `$${(item.price || 0).toFixed(2)}`
  }));

  // Use professional styled template
  const styledHtml = orderConfirmationTemplate({
    first_name: recipientFirstName,
    order_number: order.order_number,
    total_amount: `$${order.total_amount?.toFixed(2) || '0.00'}`,
    order_date: new Date(order.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    items: formattedItems.length > 0 ? formattedItems : [
      { name: 'Order Items', quantity: 1, price: `$${order.total_amount?.toFixed(2) || '0.00'}` }
    ],
    shipping_address: order.shipping_address?.address_line1 
      ? `${order.shipping_address.address_line1}\n${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip_code}`
      : 'Address on file',
    tracking_url: `https://elyphant.ai/orders/${order.id}`
  });

  // Send email with styled template
  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [recipientEmail],
    subject: `Order Confirmed! 🎉 - ${order.order_number}`,
    html: styledHtml,
  });

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
        template_id: template?.id,
        template_variables: { first_name: recipientFirstName, order_number: order.order_number },
        resend_message_id: emailResponse.data?.id
      })
  ]);

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handlePaymentConfirmation(supabase: any, orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

// Profile will be fetched separately using order.user_id

  // Check if payment confirmation email already sent
  if (order.payment_confirmation_sent) {
    console.log(`Payment confirmation already sent for ${orderId}`);
    return { skipped: true, reason: 'already_sent' };
  }

  // Only send if payment succeeded
  if (order.payment_status !== 'succeeded') {
    return { skipped: true, reason: 'payment_not_succeeded' };
  }

  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_type', 'payment_confirmation')
    .eq('is_active', true)
    .single();

  if (!template) {
    throw new Error('Payment confirmation template not found');
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
  const recipientName = profile?.name || 'Valued Customer';
  const recipientEmail = profile?.email;
  if (!recipientEmail) {
    throw new Error(`Recipient email not found for user ${order.user_id}`);
  }

  const variables = {
    customer_name: recipientName,
    order_number: order.order_number,
    total_amount: order.total_amount?.toFixed(2) || '0.00',
    payment_method: 'Card ending in ****',
    transaction_id: order.stripe_payment_intent_id || 'N/A',
    order_tracking_url: `${Deno.env.get('SITE_URL')}/orders/${order.id}`
  };

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [recipientEmail],
    subject: replaceVariables(template.subject_template, variables),
    html: replaceVariables(template.html_template, variables),
  });

  await Promise.all([
    supabase
      .from('orders')
      .update({ payment_confirmation_sent: true })
      .eq('id', orderId),
    
    supabase
      .from('order_email_events')
      .insert({
        order_id: orderId,
        email_type: 'payment_confirmation',
        recipient_email: recipientEmail,
        template_id: template.id,
        template_variables: variables,
        resend_message_id: emailResponse.data?.id
      })
  ]);

  return { emailSent: true, messageId: emailResponse.data?.id };
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

async function handleWelcomeEmail(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error(`Profile not found: ${userId}`);
  }

  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_type', 'enhanced_welcome')
    .eq('is_active', true)
    .single();

  if (!template) {
    throw new Error('Welcome email template not found');
  }

  // Use professional welcome template
  const styledHtml = welcomeEmailTemplate({
    first_name: profile.first_name || profile.name || 'Friend',
    dashboard_url: `${Deno.env.get('SITE_URL')}/dashboard`,
    profile_url: `${Deno.env.get('SITE_URL')}/profile`
  });

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [profile.email],
    subject: 'Welcome to Elyphant! 🎁',
    html: styledHtml,
  });

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handleAbandonedCart(supabase: any, cartSessionId: string) {
  const { data: cartSession, error } = await supabase
    .from('cart_sessions')
    .select(`
      *,
      profiles(name, email)
    `)
    .eq('id', cartSessionId)
    .single();

  if (error || !cartSession) {
    throw new Error(`Cart session not found: ${cartSessionId}`);
  }

  // Add fallback for missing profile
  if (!cartSession.profiles) {
    console.warn(`⚠️ Profile not found for cart session ${cartSessionId}, using fallback`);
    cartSession.profiles = { name: 'Customer', email: 'no-reply@elyphant.ai' };
  }

  // Don't send if cart was recovered or completed
  if (cartSession.is_recovered || cartSession.completed_at) {
    return { skipped: true, reason: 'cart_recovered_or_completed' };
  }

  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_type', 'abandoned_cart')
    .eq('is_active', true)
    .single();

  if (!template) {
    throw new Error('Abandoned cart template not found');
  }

  const cartItems = cartSession.cart_data?.items || [];
  const variables = {
    customer_name: cartSession.profiles?.name || 'Valued Customer',
    cart_items: cartItems,
    cart_total: (cartSession.total_amount / 100).toFixed(2),
    checkout_url: `${Deno.env.get('SITE_URL')}/checkout?session=${cartSession.session_id}`,
    expiry_hours: '24',
    discount_code: 'SAVE10',
    discount_percentage: '10'
  };

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [cartSession.profiles.email],
    subject: replaceVariables(template.subject_template, variables),
    html: replaceVariables(template.html_template, variables),
  });

  // Update cart session
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

  // Check if followup email already sent
  if (order.followup_email_sent) {
    return { skipped: true, reason: 'already_sent' };
  }

  // Only send if order was delivered
  if (order.status !== 'delivered') {
    return { skipped: true, reason: 'order_not_delivered' };
  }

  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_type', 'post_purchase_followup')
    .eq('is_active', true)
    .single();

  if (!template) {
    throw new Error('Post-purchase followup template not found');
  }

  const variables = {
    customer_name: order.profiles?.name || 'Valued Customer',
    order_number: order.order_number,
    review_url: `${Deno.env.get('SITE_URL')}/orders/${order.id}/review`,
    shop_url: `${Deno.env.get('SITE_URL')}/shop`,
    recommended_products: [] // Could fetch from recommendation engine
  };

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [order.profiles.email],
    subject: replaceVariables(template.subject_template, variables),
    html: replaceVariables(template.html_template, variables),
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
        template_id: template.id,
        template_variables: variables,
        resend_message_id: emailResponse.data?.id
      })
  ]);

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handleAutoGiftApproval(supabase: any, customData: any) {
  const html = `
    <h2>Auto-Gift Approval Required</h2>
    <p>Hello! An auto-gift is ready for your approval.</p>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Gift Details</h3>
      <p><strong>Occasion:</strong> ${customData.occasion}</p>
      <p><strong>Recipient:</strong> ${customData.recipientName}</p>
      <p><strong>Budget:</strong> $${customData.budget}</p>
      <p><strong>Total Amount:</strong> $${customData.totalAmount.toFixed(2)}</p>
      ${customData.deliveryDate ? `<p><strong>Delivery Date:</strong> ${customData.deliveryDate}</p>` : ''}
    </div>

    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h4>Selected Products:</h4>
      <pre style="white-space: pre-wrap;">${customData.productList}</pre>
    </div>

    ${customData.shippingAddress ? `
      <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4>Shipping Address:</h4>
        <p><strong>Source:</strong> ${customData.shippingAddress.source}</p>
        ${customData.shippingAddress.needs_confirmation ? '<p style="color: #e67e22;"><strong>⚠️ Address requires confirmation</strong></p>' : ''}
      </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${customData.approveUrl}" style="background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px;">
        ✅ Approve Gift
      </a>
      <a href="${customData.rejectUrl}" style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px;">
        ❌ Reject Gift
      </a>
    </div>

    <p style="color: #666; font-size: 12px;">
      This approval request expires on ${new Date(customData.expiresAt).toLocaleDateString()}.
      If you don't respond, the gift will be automatically cancelled.
    </p>
  `;

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [customData.recipientEmail],
    subject: `Auto-Gift Approval Required - ${customData.occasion} for ${customData.recipientName}`,
    html,
  });

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handleGiftInvitation(supabase: any, customData: any) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Invited to Elyphant!</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">
          🎁 You're Invited to Elyphant!
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 18px;">
          ${customData.giftorName} wants to get you amazing gifts${customData.occasionText}${customData.dateText}
        </p>
      </div>

      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 30px;">
        <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 22px;">Hi ${customData.recipientName}! 👋</h2>
        
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #4a5568;">
          ${customData.giftorName} has invited you to join <strong>Elyphant</strong> - the platform that ensures you get gifts you'll actually love!
        </p>
        
        ${customData.occasion ? `
          <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-size: 16px; color: #2d3748;">
              <strong>🎉 Special Occasion:</strong> ${customData.giftorName} wants to make your ${customData.occasion}${customData.dateText} extra special!
            </p>
          </div>
        ` : ''}

        <h3 style="color: #2d3748; margin: 30px 0 15px 0; font-size: 20px;">✨ What makes Elyphant special?</h3>
        
        <ul style="padding-left: 0; list-style: none;">
          <li style="margin: 15px 0; padding-left: 30px; position: relative;">
            <span style="position: absolute; left: 0; top: 2px; font-size: 18px;">🎯</span>
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

// ============= NEW EVENT HANDLERS =============

async function handleConnectionInvitation(supabase: any, customData: any) {
  console.log("📧 Sending connection invitation email");
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">${customData.senderName} wants to connect!</h1>
      <p>Hi ${customData.recipientName},</p>
      <p>${customData.senderName} has invited you to connect on Elyphant.</p>
      ${customData.customMessage ? `<p style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-style: italic;">"${customData.customMessage}"</p>` : ''}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${customData.invitationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [customData.recipientEmail],
    subject: `${customData.senderName} invited you to connect on Elyphant`,
    html: htmlContent,
  });

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
  console.log("🎁 Sending wishlist welcome email");
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Welcome to Your Wishlist!</h1>
      <p>Hi ${customData.userName},</p>
      <p>Your wishlist has been created! Start adding items you love.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${customData.wishlistUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Wishlist</a>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [customData.email],
    subject: "Your Wishlist is Ready! - Elyphant",
    html: htmlContent,
  });

  return { success: true };
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

async function handleOrderReceipt(supabase: any, orderId: string) {
  console.log("📧 Sending order receipt");
  
  // Reuse order confirmation logic
  return await handleOrderConfirmation(supabase, orderId);
}

serve(handler);