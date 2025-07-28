import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import { EmailTemplateService } from "../../../src/services/EmailTemplateService.ts";

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

    // Generate email template using EmailTemplateService
    const templateData = {
      recipientEmail: emailRequest.recipientEmail,
      recipientName: emailRequest.recipientName,
      giftDetails: emailRequest.giftDetails,
      deliveryDate: emailRequest.deliveryDate,
      approveUrl,
      rejectUrl,
      reviewUrl,
      totalAmount
    };

    const emailTemplate = EmailTemplateService.generateApprovalEmail(templateData);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Nicole - Gift Assistant <gifts@yourdomain.com>",
      to: [user.email!],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
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