import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  order_id: string;
  user_email: string;
  payment_method_used: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, user_email, payment_method_used }: OrderConfirmationRequest = await req.json();

    console.log('📧 Sending order confirmation email:', {
      order_id,
      user_email,
      payment_method_used,
      timestamp: new Date().toISOString()
    });

    // Create Supabase client to fetch order details
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          unit_price,
          product_id
        )
      `)
      .eq('id', order_id)
      .single()

    if (orderError) {
      throw new Error(`Failed to fetch order details: ${orderError.message}`)
    }

    // Calculate order total
    const orderTotal = order.order_items.reduce((total: number, item: any) => {
      return total + (item.quantity * item.unit_price)
    }, 0)

    // Create order items HTML
    const orderItemsHtml = order.order_items.map((item: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; font-size: 14px;">Product ID: ${item.product_id}</td>
        <td style="padding: 12px 0; font-size: 14px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; font-size: 14px; text-align: right;">$${item.unit_price.toFixed(2)}</td>
        <td style="padding: 12px 0; font-size: 14px; text-align: right; font-weight: 600;">$${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>
    `).join('')

    // Determine payment method display text
    const paymentMethodDisplay = payment_method_used === 'saved_payment_method' 
      ? 'Saved Payment Method' 
      : payment_method_used === 'card'
      ? 'Credit/Debit Card'
      : payment_method_used === 'express'
      ? 'Express Checkout'
      : 'Demo Payment'

    // Create Supabase client for calling email service
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const emailResponse = await supabase.functions.invoke('send-email-notification', {
      body: {
        recipientEmail: user_email,
        subject: `Order Confirmation - ${order.order_number}`,
        htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Order Confirmed! 🎉</h1>
              <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Thank you for your purchase</p>
            </div>

            <!-- Order Details -->
            <div style="padding: 30px;">
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h2 style="margin: 0 0 15px; font-size: 20px; color: #1e293b;">Order Summary</h2>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: 600;">Order Number:</span>
                  <span style="font-family: monospace; background: white; padding: 4px 8px; border-radius: 4px;">${order.order_number}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: 600;">Order Date:</span>
                  <span>${new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: 600;">Payment Method:</span>
                  <span>${paymentMethodDisplay}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-weight: 600;">Status:</span>
                  <span style="color: #059669; font-weight: 600;">${order.status}</span>
                </div>
              </div>

              <!-- Order Items -->
              <h3 style="margin: 25px 0 15px; font-size: 18px; color: #1e293b;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px 0; text-align: left; font-weight: 600; font-size: 14px;">Item</th>
                    <th style="padding: 12px 0; text-align: center; font-weight: 600; font-size: 14px;">Qty</th>
                    <th style="padding: 12px 0; text-align: right; font-weight: 600; font-size: 14px;">Price</th>
                    <th style="padding: 12px 0; text-align: right; font-weight: 600; font-size: 14px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHtml}
                </tbody>
              </table>

              <!-- Order Total -->
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; text-align: right;">
                <div style="font-size: 18px; font-weight: 700; color: #1e293b;">
                  Order Total: $${orderTotal.toFixed(2)}
                </div>
              </div>

              <!-- Shipping Info -->
              ${order.shipping_info ? `
              <div style="margin-top: 25px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #1e293b;">Shipping Address</h3>
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; font-size: 14px; line-height: 1.5;">
                  ${order.shipping_info.name}<br>
                  ${order.shipping_info.address}<br>
                  ${order.shipping_info.line2 ? `${order.shipping_info.line2}<br>` : ''}
                  ${order.shipping_info.city}, ${order.shipping_info.state} ${order.shipping_info.zipCode}<br>
                  ${order.shipping_info.country || 'US'}
                </div>
              </div>
              ` : ''}

              <!-- Next Steps -->
              <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px;">
                <h3 style="margin: 0 0 10px; font-size: 16px; color: #92400e;">What's Next?</h3>
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  🚚 Your order is being processed and will be shipped soon<br>
                  📧 You'll receive tracking information once your order ships<br>
                  💬 Questions? Contact our support team anytime
                </p>
              </div>

              <!-- Footer -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">
                <p>Thank you for shopping with Elyphant!</p>
                <p style="margin: 5px 0;">Need help? Contact us at support@elyphant.com</p>
              </div>
            </div>
          </div>
        </body>
        </html>
        `,
        notificationType: 'order_confirmation'
      }
    });

    // Robust handling of provider response with fallback
    console.log("📨 Resend response:", emailResponse);
    
    let finalEmailId = null;
    let usedFallback = false;
    
    if ((emailResponse as any)?.error || !(emailResponse as any)?.data?.id) {
      console.log("⚠️ Resend failed or returned no ID, attempting fallback to send-email-notification...");
      
      try {
        // Fallback: Use the working send-email-notification function
        const fallbackResponse = await supabase.functions.invoke('send-email-notification', {
          body: {
            recipientEmail: user_email,
            subject: `Order Confirmation - ${order.order_number}`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Order Confirmed! 🎉</h1>
                <p>Thank you for your purchase, your order <strong>${order.order_number}</strong> has been confirmed.</p>
                <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                  <h3>Order Details:</h3>
                  <p><strong>Order Number:</strong> ${order.order_number}</p>
                  <p><strong>Total:</strong> $${orderTotal.toFixed(2)}</p>
                  <p><strong>Payment Method:</strong> ${paymentMethodDisplay}</p>
                  <p><strong>Status:</strong> ${order.status}</p>
                </div>
                <p>You'll receive tracking information once your order ships.</p>
                <p style="color: #666; font-size: 12px;">Thank you for shopping with Elyphant!</p>
              </div>
            `,
            notificationType: 'order_confirmation'
          }
        });
        
        if (fallbackResponse.error) {
          throw new Error(`Fallback failed: ${fallbackResponse.error.message}`);
        }
        
        finalEmailId = fallbackResponse.data?.emailId || 'fallback-sent';
        usedFallback = true;
        console.log("✅ Fallback email sent successfully via send-email-notification");
        
      } catch (fallbackError) {
        console.error('❌ Both primary and fallback email methods failed:', fallbackError);
        throw new Error(`Email delivery failed: ${fallbackError.message}`);
      }
      
    } else {
      finalEmailId = (emailResponse as any).data.id;
      console.log("✅ Primary Resend email sent successfully");
    }

    console.log("✅ Order confirmation email sent successfully:", {
      order_number: order.order_number,
      user_email,
      payment_method_used,
      email_id: finalEmailId,
      used_fallback: usedFallback
    });

    return new Response(JSON.stringify({ 
      success: true,
      email_id: finalEmailId,
      order_number: order.order_number,
      used_fallback: usedFallback
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error sending order confirmation email:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);