import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import { EmailTemplateService } from "../../../src/services/EmailTemplateService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  executionId: string;
  hoursRemaining: number;
  tokenId: string;
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

    const emailTemplate = EmailTemplateService.generateReminderEmail(templateData);

    // Send reminder email
    const emailResponse = await resend.emails.send({
      from: "Nicole - Gift Assistant <gifts@yourdomain.com>",
      to: [user.email!],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
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