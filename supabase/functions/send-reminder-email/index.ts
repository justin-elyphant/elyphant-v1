import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  executionId: string;
  hoursRemaining: number;
  tokenId: string;
}

// Email template generation functions (self-contained within edge function)
function generateReminderEmail(templateData: any) {
  const { 
    recipientName, 
    giftDetails, 
    deliveryDate, 
    approveUrl, 
    rejectUrl, 
    reviewUrl, 
    totalAmount, 
    hoursRemaining 
  } = templateData;

  const subject = `🎁 Gift Approval Reminder - ${hoursRemaining} hours remaining`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gift Approval Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .gift-details { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .action-buttons { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 15px 30px; margin: 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .btn-approve { background-color: #28a745; color: white; }
        .btn-review { background-color: #007bff; color: white; }
        .btn-reject { background-color: #dc3545; color: white; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .urgent { color: #dc3545; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎁 Gift Approval Reminder</h1>
          <p>Your auto-gift needs approval!</p>
        </div>
        
        <div class="content">
          <p>Hi ${recipientName || 'there'},</p>
          
          <p class="urgent">⏰ Only ${hoursRemaining} hours remaining to approve your gift!</p>
          
          <p>Your auto-gift is ready to be sent, but we need your final approval before proceeding.</p>
          
          <div class="gift-details">
            <h3>Gift Details:</h3>
            <p><strong>Occasion:</strong> ${giftDetails?.occasion || 'Special Occasion'}</p>
            <p><strong>Budget:</strong> $${totalAmount || '0.00'}</p>
            <p><strong>Delivery Date:</strong> ${new Date(deliveryDate).toLocaleDateString()}</p>
            ${giftDetails?.selectedProducts?.length ? `<p><strong>Items:</strong> ${giftDetails.selectedProducts.length} item(s) selected</p>` : ''}
          </div>
          
          <p>Please choose one of the following actions:</p>
          
          <div class="action-buttons">
            <a href="${approveUrl}" class="btn btn-approve">✅ Approve & Send Gift</a>
            <a href="${reviewUrl}" class="btn btn-review">👀 Review Details</a>
            <a href="${rejectUrl}" class="btn btn-reject">❌ Cancel Gift</a>
          </div>
          
          <p><strong>Important:</strong> If no action is taken, this gift will be automatically cancelled when the approval period expires.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from Elyphant Gift Assistant</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Gift Approval Reminder - ${hoursRemaining} hours remaining

Hi ${recipientName || 'there'},

Only ${hoursRemaining} hours remaining to approve your gift!

Your auto-gift is ready to be sent, but we need your final approval before proceeding.

Gift Details:
- Occasion: ${giftDetails?.occasion || 'Special Occasion'}
- Budget: $${totalAmount || '0.00'}
- Delivery Date: ${new Date(deliveryDate).toLocaleDateString()}
${giftDetails?.selectedProducts?.length ? `- Items: ${giftDetails.selectedProducts.length} item(s) selected` : ''}

Actions:
- Approve & Send Gift: ${approveUrl}
- Review Details: ${reviewUrl}
- Cancel Gift: ${rejectUrl}

Important: If no action is taken, this gift will be automatically cancelled when the approval period expires.

This is an automated reminder from Elyphant Gift Assistant.
  `;

  return { subject, html, text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const { executionId, hoursRemaining, tokenId }: ReminderRequest = await req.json();

    // Get token and execution details
    const { data: tokenData, error: tokenError } = await supabase
      .from("email_approval_tokens")
      .select(`
        *,
        automated_gift_executions (*)
      `)
      .eq("id", tokenId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Token not found");
    }

    // Check if already processed
    if (tokenData.approved_at || tokenData.rejected_at) {
      return new Response(
        JSON.stringify({ message: "Token already processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ message: "Token already expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const execution = tokenData.automated_gift_executions;
    if (!execution) {
      throw new Error("Execution not found");
    }

    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(tokenData.user_id);
    if (userError || !user) {
      throw new Error("User not found");
    }

    // Create approval URLs
    const baseUrl = "https://yourapp.com"; // Replace with actual domain
    const approveUrl = `${baseUrl}/approve-gift?token=${tokenData.token}&action=approve`;
    const rejectUrl = `${baseUrl}/approve-gift?token=${tokenData.token}&action=reject`;
    const reviewUrl = `${baseUrl}/approve-gift?token=${tokenData.token}&action=review`;

    // Mock gift details - in real implementation, this would come from execution data
    const giftDetails = {
      occasion: "Special Occasion",
      budget: execution.total_amount,
      selectedProducts: execution.selected_products || []
    };

    // Generate reminder email template
    const templateData = {
      recipientEmail: user.email!,
      recipientName: "Recipient", // This would come from execution data
      giftDetails,
      deliveryDate: execution.execution_date,
      approveUrl,
      rejectUrl,
      reviewUrl,
      totalAmount: execution.total_amount,
      hoursRemaining
    };

    const emailTemplate = generateReminderEmail(templateData);

    // Send reminder email using email notification service
    const emailResponse = await supabase.functions.invoke('send-email-notification', {
      body: {
        recipientEmail: user.email!,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.html,
        notificationType: 'auto_gift_reminder'
      }
    });

    if (emailResponse.error) {
      console.error("Error sending reminder email:", emailResponse.error);
      throw new Error("Failed to send reminder email");
    }

    // Log reminder delivery
    await supabase
      .from("email_delivery_logs")
      .insert({
        token_id: tokenId,
        delivery_status: "reminder_sent",
        event_data: { 
          email_id: emailResponse.data?.id,
          reminder_type: `${hoursRemaining}h_reminder`,
          hours_remaining: hoursRemaining,
          timestamp: new Date().toISOString()
        }
      });

    console.log("Reminder email sent successfully:", {
      executionId,
      tokenId,
      hoursRemaining,
      emailId: emailResponse.data?.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Reminder email sent successfully",
        emailId: emailResponse.data?.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in send-reminder-email:", error);
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