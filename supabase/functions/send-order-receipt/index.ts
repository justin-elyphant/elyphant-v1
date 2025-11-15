import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    console.log("📨 send-order-receipt invoked", { orderId, ts: new Date().toISOString() });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    console.log("Env present", {
      hasSRK: !!supabaseServiceKey,
      hasURL: !!supabaseUrl,
    });

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get order details (NEW ARCHITECTURE: line_items stored in JSONB)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found", details: orderError?.message }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get customer email and name from auth.users or order data
    let customerEmail: string | null = null;
    let customerName: string = "Customer";

    // First try to get user info from auth.users
    if (order.user_id) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(order.user_id);
      if (authUser?.user && !authError) {
        customerEmail = authUser.user.email ?? null;
        customerName = authUser.user.user_metadata?.first_name 
          ? `${authUser.user.user_metadata.first_name} ${authUser.user.user_metadata.last_name || ''}`.trim()
          : (authUser.user.email?.split('@')[0] || "Customer");
      }
    }

    // Fallback to shipping info if available
    if (!customerEmail && order.shipping_info) {
      customerEmail = order.shipping_info.email;
      customerName = order.shipping_info.name || customerName;
    }

    if (!customerEmail) {
      console.error("No customer email found for order:", orderId);
      return new Response(
        JSON.stringify({ error: "Customer email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format order items for email (NEW ARCHITECTURE: from line_items JSONB)
    const lineItems = order.line_items || [];
    const orderItemsHtml = lineItems.map((item: any) => {
      const unit = Number(item.unit_price ?? item.price ?? 0);
      const qty = Number(item.quantity ?? 1);
      const lineTotal = unit * qty;
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 600;">${item.name || item.title || item.product_name || 'Item'}</div>
          ${item.variant_details ? `<div style=\"font-size: 14px; color: #6b7280;\">${item.variant_details}</div>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${qty}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          $${lineTotal.toFixed(2)}
        </td>
      </tr>`;
    }).join('');

    // Calculate totals (NEW ARCHITECTURE: use order financial fields)
    const subtotal = Number(order.subtotal ?? lineItems.reduce((sum: number, item: any) => {
      const unit = Number(item.unit_price ?? item.price ?? 0);
      const qty = Number(item.quantity ?? 1);
      return sum + unit * qty;
    }, 0));
    const shipping = Number(order.shipping_cost ?? 0);
    const tax = Number(order.tax_amount ?? 0);
    const giftingFee = Number(order.gifting_fee ?? 0);
    const total = Number(order.total_amount ?? (subtotal + shipping + tax + giftingFee));

    // Get customer-facing status (hide internal Zinc status)
    const getCustomerFacingStatus = (rawStatus: string) => {
      const status = rawStatus.toLowerCase();
      
      // Map internal statuses to customer-facing ones
      switch (status) {
        case 'submitted_to_zinc':
        case 'confirmed':
          return 'Processing';
        case 'retry_pending':
          return 'Processing';
        case 'shipped':
          return 'Shipped';
        case 'delivered':
          return 'Delivered';
        case 'cancelled':
          return 'Cancelled';
        case 'failed':
          return 'Failed';
        default:
          return status.charAt(0).toUpperCase() + status.slice(1);
      }
    };

    const customerStatus = getCustomerFacingStatus(order.status);

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
                  <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${customerStatus}
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
              ${giftingFee > 0 ? `
              <tr>
                <td style="padding: 8px 0;">Gifting Fee:</td>
                <td style="padding: 8px 0; text-align: right;">$${giftingFee.toFixed(2)}</td>
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

    // Send email using the send-email-notification function
    const emailResponse = await supabase.functions.invoke('send-email-notification', {
      body: {
        recipientEmail: customerEmail,
        subject: `Order Receipt - #${orderId.slice(-6)}`,
        htmlContent: receiptHtml,
        notificationType: 'order_receipt'
      }
    });

    if (emailResponse.error) {
      console.error("❌ Email service error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error.message || "Email service failed" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("📧 Order receipt email sent:", emailResponse.data?.messageId);
    // Log the email send event (lightweight note)
    await supabase
      .from('order_notes')
      .insert({
        order_id: orderId,
        note_content: `Order receipt emailed to ${customerEmail} (Message ID: ${emailResponse.data?.messageId || 'n/a'})`,
        note_type: 'email_sent',
        is_internal: false
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Receipt sent successfully",
        messageId: emailResponse.data?.messageId 
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