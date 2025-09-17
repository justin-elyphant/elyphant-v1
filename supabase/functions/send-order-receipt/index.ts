import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderReceiptRequest {
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId }: OrderReceiptRequest = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get order details with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        profiles (email, name)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get customer email
    const customerEmail = order.profiles?.email;
    const customerName = order.profiles?.name || order.shipping_info?.name || "Customer";

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "Customer email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format order items for email
    const orderItemsHtml = order.order_items?.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 600;">${item.name || item.product_name}</div>
          ${item.variant_details ? `<div style="font-size: 14px; color: #6b7280;">${item.variant_details}</div>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('') || '';

    // Calculate totals
    const subtotal = order.order_items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
    const shipping = order.shipping_cost || 0;
    const tax = order.tax_amount || 0;
    const total = order.total_amount || subtotal + shipping + tax;

    // Create receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Receipt</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="text-align: center; border-bottom: 3px solid #8B5CF6; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6; margin: 0; font-size: 28px;">Elyphant</h1>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Order Receipt</p>
          </div>

          <!-- Order Info -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; color: #374151;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Order Number:</td>
                <td style="padding: 8px 0; text-align: right;">#${orderId.slice(-6)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Date:</td>
                <td style="padding: 8px 0; text-align: right;">${new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Status:</td>
                <td style="padding: 8px 0; text-align: right;">
                  <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: capitalize;">
                    ${order.status}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Items -->
          <div style="margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; color: #374151;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 15px 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Item</th>
                  <th style="padding: 15px 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">Qty</th>
                  <th style="padding: 15px 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;">Subtotal:</td>
                <td style="padding: 8px 0; text-align: right;">$${subtotal.toFixed(2)}</td>
              </tr>
              ${shipping > 0 ? `
              <tr>
                <td style="padding: 8px 0;">Shipping:</td>
                <td style="padding: 8px 0; text-align: right;">$${shipping.toFixed(2)}</td>
              </tr>
              ` : ''}
              ${tax > 0 ? `
              <tr>
                <td style="padding: 8px 0;">Tax:</td>
                <td style="padding: 8px 0; text-align: right;">$${tax.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #e5e7eb; font-weight: bold; font-size: 18px;">
                <td style="padding: 15px 0 8px 0;">Total:</td>
                <td style="padding: 15px 0 8px 0; text-align: right;">$${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <!-- Shipping Address -->
          ${order.shipping_info ? `
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; color: #374151;">Shipping Address</h2>
            <div style="color: #6b7280;">
              ${order.shipping_info.name || customerName}<br>
              ${order.shipping_info.address_line1 || ''}<br>
              ${order.shipping_info.address_line2 ? `${order.shipping_info.address_line2}<br>` : ''}
              ${order.shipping_info.city || ''}, ${order.shipping_info.state || ''} ${order.shipping_info.postal_code || ''}<br>
              ${order.shipping_info.country || ''}
            </div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p>Thank you for your order!</p>
            <p>Questions? Contact us at support@elyphant.com</p>
          </div>

        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Elyphant <noreply@elyphant.com>",
      to: [customerEmail],
      subject: `Order Receipt - #${orderId.slice(-6)}`,
      html: receiptHtml,
    });

    console.log("📧 Order receipt email sent:", emailResponse);

    // Log the email send event
    await supabase
      .from('order_notes')
      .insert({
        order_id: orderId,
        note_content: `Order receipt emailed to ${customerEmail}`,
        note_type: 'email_sent',
        is_internal: false,
        metadata: {
          email_type: 'receipt',
          recipient: customerEmail,
          resend_message_id: emailResponse.data?.id
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Receipt sent successfully",
        messageId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error sending order receipt:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send receipt",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);