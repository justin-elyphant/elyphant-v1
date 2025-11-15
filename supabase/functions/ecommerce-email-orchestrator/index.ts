import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { orderId, emailType } = body;
    
    console.log(`📧 Email orchestrator invoked: ${emailType} for order ${orderId}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // IDEMPOTENCY: Check if receipt already sent
    if (order.receipt_sent_at) {
      console.log(`✅ Receipt already sent at ${order.receipt_sent_at}, skipping...`);
      return new Response(
        JSON.stringify({ success: true, message: 'Receipt already sent', sent_at: order.receipt_sent_at }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recipient email
    const recipientEmail = order.shipping_address?.email || 
                           (order.user_id ? await getUserEmail(order.user_id, supabase) : null);

    if (!recipientEmail) {
      throw new Error('No recipient email found for order');
    }

    // Get line items from order.line_items JSONB
    const lineItems = order.line_items || [];
    
    if (lineItems.length === 0) {
      console.warn('⚠️ Order has no line items, sending minimal receipt');
    }

    // Calculate financial breakdown
    const subtotal = order.subtotal || lineItems.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0);
    const shippingCost = order.shipping_cost || 0;
    const taxAmount = order.tax_amount || 0;
    const giftingFee = order.gifting_fee || 0;
    const totalAmount = order.total_amount;

    // Build email HTML
    const emailHtml = buildOrderConfirmationEmail({
      orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
      customerName: order.shipping_address?.name || 'Valued Customer',
      lineItems: lineItems,
      subtotal: subtotal,
      shippingCost: shippingCost,
      taxAmount: taxAmount,
      giftingFee: giftingFee,
      totalAmount: totalAmount,
      shippingAddress: order.shipping_address,
      estimatedDelivery: order.estimated_delivery,
      isGift: order.gift_options?.is_gift || false,
      giftMessage: order.gift_options?.message || '',
    });

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Elyphant <orders@elyphant.com>',
      to: [recipientEmail],
      subject: `Order Confirmation - Order #${order.order_number || order.id.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('❌ Failed to send email:', emailError);
      throw new Error(`Email send failed: ${emailError.message}`);
    }

    console.log(`✅ Email sent successfully: ${emailData?.id}`);

    // Update order with receipt_sent_at timestamp
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        receipt_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Failed to update receipt_sent_at:', updateError);
      // Don't throw - email was sent successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailData?.id,
        recipient: recipientEmail,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in email orchestrator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function getUserEmail(userId: string, supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
  
  return data?.email || null;
}

function buildOrderConfirmationEmail(data: any): string {
  const {
    orderNumber,
    customerName,
    lineItems,
    subtotal,
    shippingCost,
    taxAmount,
    giftingFee,
    totalAmount,
    shippingAddress,
    estimatedDelivery,
    isGift,
    giftMessage,
  } = data;

  const lineItemsHtml = lineItems.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;">` : ''}
        <strong>${item.name}</strong><br/>
        <span style="color: #6b7280;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Order Confirmed!</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Order #${orderNumber}</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px 24px;">
          <p style="font-size: 16px; color: #111827; margin: 0 0 24px 0;">
            Hi ${customerName},
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px 0; line-height: 1.6;">
            Thank you for your order! We're getting your items ready to ship. You'll receive a shipping confirmation email with tracking information once your order is on its way.
          </p>

          ${isGift && giftMessage ? `
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>🎁 Gift Message:</strong></p>
            <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px; font-style: italic;">"${giftMessage}"</p>
          </div>
          ` : ''}

          <!-- Order Items -->
          <h2 style="font-size: 18px; color: #111827; margin: 0 0 16px 0; font-weight: 600;">Order Summary</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            ${lineItemsHtml}
          </table>

          <!-- Pricing Breakdown -->
          <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280; font-size: 14px;">Subtotal:</span>
              <span style="color: #111827; font-size: 14px;">$${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280; font-size: 14px;">Shipping:</span>
              <span style="color: #111827; font-size: 14px;">${shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'FREE'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280; font-size: 14px;">Tax:</span>
              <span style="color: #111827; font-size: 14px;">$${taxAmount.toFixed(2)}</span>
            </div>
            ${giftingFee > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280; font-size: 14px;">Gifting Fee:</span>
              <span style="color: #111827; font-size: 14px;">$${giftingFee.toFixed(2)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <span style="color: #111827; font-size: 16px; font-weight: 700;">Total:</span>
              <span style="color: #667eea; font-size: 16px; font-weight: 700;">$${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <!-- Shipping Address -->
          <h3 style="font-size: 16px; color: #111827; margin: 0 0 12px 0; font-weight: 600;">Shipping Address</h3>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.6;">
              ${shippingAddress?.name}<br/>
              ${shippingAddress?.address_line1}<br/>
              ${shippingAddress?.address_line2 ? `${shippingAddress.address_line2}<br/>` : ''}
              ${shippingAddress?.city}, ${shippingAddress?.state} ${shippingAddress?.postal_code}<br/>
              ${shippingAddress?.country || 'US'}
            </p>
          </div>

          ${estimatedDelivery ? `
          <p style="font-size: 14px; color: #6b7280; margin: 0;">
            <strong>Estimated Delivery:</strong> ${new Date(estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
            Questions? Contact us at <a href="mailto:support@elyphant.com" style="color: #667eea; text-decoration: none;">support@elyphant.com</a>
          </p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            © ${new Date().getFullYear()} Elyphant. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
