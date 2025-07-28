import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailApprovalRequest {
  executionId: string;
  recipientEmail: string;
  recipientName: string;
  giftDetails: {
    occasion: string;
    budget: number;
    selectedProducts: Array<{
      id: string;
      title: string;
      price: number;
      image: string;
      marketplace: string;
    }>;
  };
  deliveryDate?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize services
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid or expired token");
    }

    const emailRequest: EmailApprovalRequest = await req.json();
    
    // Generate secure approval token
    const approvalToken = crypto.randomUUID() + "-" + Date.now();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    
    // Store approval token in database
    const { error: tokenError } = await supabase
      .from("email_approval_tokens")
      .insert({
        execution_id: emailRequest.executionId,
        user_id: user.id,
        token: approvalToken,
        expires_at: expiresAt.toISOString(),
      });
    
    if (tokenError) {
      console.error("Error creating approval token:", tokenError);
      throw new Error("Failed to create approval token");
    }

    // Create approval URLs
    const baseUrl = req.headers.get("origin") || "https://localhost:3000";
    const approveUrl = `${baseUrl}/approve-gift?token=${approvalToken}&action=approve`;
    const rejectUrl = `${baseUrl}/approve-gift?token=${approvalToken}&action=reject`;
    const reviewUrl = `${baseUrl}/approve-gift?token=${approvalToken}&action=review`;

    // Calculate total amount
    const totalAmount = emailRequest.giftDetails.selectedProducts.reduce(
      (sum, product) => sum + product.price, 0
    );

    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auto-Gift Approval Needed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 24px; text-align: center; }
          .content { padding: 24px; }
          .gift-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
          .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 16px 0; }
          .product-item { text-align: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
          .product-image { width: 80px; height: 80px; object-fit: cover; border-radius: 6px; margin: 0 auto 8px; }
          .button { display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px; text-align: center; }
          .btn-approve { background-color: #10b981; color: white; }
          .btn-reject { background-color: #ef4444; color: white; }
          .btn-review { background-color: #6366f1; color: white; }
          .footer { background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 14px; color: #64748b; }
          .urgency { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Auto-Gift Ready for Approval</h1>
            <p>Your smart gift for ${emailRequest.recipientName} is ready to send!</p>
          </div>
          
          <div class="content">
            <div class="urgency">
              <strong>⏰ Action Required:</strong> This auto-gift approval expires in 48 hours
            </div>
            
            <div class="gift-card">
              <h2>Gift Details</h2>
              <p><strong>Recipient:</strong> ${emailRequest.recipientName}</p>
              <p><strong>Occasion:</strong> ${emailRequest.giftDetails.occasion}</p>
              <p><strong>Budget:</strong> $${emailRequest.giftDetails.budget}</p>
              <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
              ${emailRequest.deliveryDate ? `<p><strong>Delivery Date:</strong> ${emailRequest.deliveryDate}</p>` : ''}
            </div>

            <div class="gift-card">
              <h3>Selected Gifts</h3>
              <div class="product-grid">
                ${emailRequest.giftDetails.selectedProducts.map(product => `
                  <div class="product-item">
                    <img src="${product.image}" alt="${product.title}" class="product-image">
                    <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px;">${product.title}</div>
                    <div style="color: #10b981; font-weight: 600;">$${product.price.toFixed(2)}</div>
                    <div style="font-size: 10px; color: #64748b;">${product.marketplace}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${approveUrl}" class="button btn-approve">✅ APPROVE & SEND</a>
              <a href="${reviewUrl}" class="button btn-review">👀 REVIEW FIRST</a>
              <a href="${rejectUrl}" class="button btn-reject">❌ REJECT</a>
            </div>

            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h4>What happens next?</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Approve:</strong> Gift will be purchased and shipped immediately</li>
                <li><strong>Review:</strong> See detailed options and customize before sending</li>
                <li><strong>Reject:</strong> Cancel this auto-gift (no charges will be made)</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>This auto-gift was created by your intelligent gift assistant.</p>
            <p>Questions? Reply to this email or check your dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Nicole - Gift Assistant <gifts@yourdomain.com>",
      to: [user.email!],
      subject: `🎁 Auto-Gift Approval: ${emailRequest.giftDetails.occasion} gift for ${emailRequest.recipientName}`,
      html: htmlContent,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      throw new Error("Failed to send approval email");
    }

    // Log email delivery
    await supabase
      .from("email_delivery_logs")
      .insert({
        token_id: (await supabase
          .from("email_approval_tokens")
          .select("id")
          .eq("token", approvalToken)
          .single()).data?.id,
        delivery_status: "sent",
        event_data: { 
          email_id: emailResponse.data?.id,
          recipient: user.email,
          subject: `Auto-Gift Approval: ${emailRequest.giftDetails.occasion} gift for ${emailRequest.recipientName}`
        }
      });

    // Update the approval token with email sent timestamp
    await supabase
      .from("email_approval_tokens")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("token", approvalToken);

    console.log("Email approval sent successfully:", {
      executionId: emailRequest.executionId,
      userId: user.id,
      emailId: emailResponse.data?.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Approval email sent successfully",
        approvalToken,
        expiresAt: expiresAt.toISOString(),
        emailId: emailResponse.data?.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in send-auto-gift-approval-email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});