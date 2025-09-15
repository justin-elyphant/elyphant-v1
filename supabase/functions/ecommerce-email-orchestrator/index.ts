import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  eventType: 'order_created' | 'payment_confirmed' | 'order_status_changed' | 'order_cancelled' | 'user_welcomed' | 'cart_abandoned' | 'post_purchase_followup';
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
    .select(`
      *,
      profiles!inner(name, email)
    `)
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
          <p>We've received your order #{{order_number}} for ${{total_amount}}.</p>
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

  // Prepare template variables
  const variables = {
    customer_name: order.profiles?.name || 'Valued Customer',
    order_number: order.order_number,
    total_amount: (order.total_amount / 100).toFixed(2),
    order_date: new Date(order.created_at).toLocaleDateString(),
    order_tracking_url: `https://dmkxtkvlispxeqfzlczr.supabase.co/orders/${order.id}`,
    support_email: 'hello@elyphant.ai'
  };

  // Send email
  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [order.profiles.email],
    subject: replaceVariables(template.subject_template, variables),
    html: replaceVariables(template.html_template, variables),
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
        recipient_email: order.profiles.email,
        template_id: template.id,
        template_variables: variables,
        resend_message_id: emailResponse.data?.id
      })
  ]);

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handlePaymentConfirmation(supabase: any, orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!inner(name, email)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

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

  const variables = {
    customer_name: order.profiles?.name || 'Valued Customer',
    order_number: order.order_number,
    total_amount: (order.total_amount / 100).toFixed(2),
    payment_method: 'Card ending in ****',
    transaction_id: order.stripe_payment_intent_id || 'N/A',
    order_tracking_url: `${Deno.env.get('SITE_URL')}/orders/${order.id}`
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
      .update({ payment_confirmation_sent: true })
      .eq('id', orderId),
    
    supabase
      .from('order_email_events')
      .insert({
        order_id: orderId,
        email_type: 'payment_confirmation',
        recipient_email: order.profiles.email,
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
      profiles!inner(name, email)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
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
      profiles!inner(name, email)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
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

  const variables = {
    user_name: profile.name || profile.first_name || 'Friend',
    dashboard_url: `${Deno.env.get('SITE_URL')}/dashboard`,
    profile_url: `${Deno.env.get('SITE_URL')}/profile`
  };

  const emailResponse = await resend.emails.send({
    from: "Elyphant <hello@elyphant.ai>",
    to: [profile.email],
    subject: replaceVariables(template.subject_template, variables),
    html: replaceVariables(template.html_template, variables),
  });

  return { emailSent: true, messageId: emailResponse.data?.id };
}

async function handleAbandonedCart(supabase: any, cartSessionId: string) {
  const { data: cartSession, error } = await supabase
    .from('cart_sessions')
    .select(`
      *,
      profiles!inner(name, email)
    `)
    .eq('id', cartSessionId)
    .single();

  if (error || !cartSession) {
    throw new Error(`Cart session not found: ${cartSessionId}`);
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
      profiles!inner(name, email)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
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

function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  
  // Replace simple variables like {{variable_name}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value || ''));
  });
  
  // Handle conditional blocks like {{#if variable}}content{{/if}}
  result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, variable, content) => {
    return variables[variable] ? content : '';
  });
  
  // Handle each loops like {{#each array}}{{name}}{{/each}}
  result = result.replace(/{{#each\s+(\w+)}}(.*?){{\/each}}/gs, (match, arrayName, itemTemplate) => {
    const array = variables[arrayName];
    if (!Array.isArray(array)) return '';
    
    return array.map(item => {
      let itemHtml = itemTemplate;
      Object.entries(item).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        itemHtml = itemHtml.replace(regex, String(value || ''));
      });
      return itemHtml;
    }).join('');
  });
  
  return result;
}

serve(handler);