import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.1.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface EmailNotificationRequest {
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  recipientName?: string;
  notificationType: 'auto_gift_approval' | 'auto_gift_confirmation' | 'gift_delivered' | 'welcome_wishlist' | 'general';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      recipientEmail,
      subject,
      htmlContent,
      recipientName,
      notificationType
    }: EmailNotificationRequest = await req.json();

    // Validate required fields
    if (!recipientEmail || !subject || !htmlContent) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: recipientEmail, subject, htmlContent" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`📧 Sending ${notificationType} email to ${recipientEmail}`);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Elyphant <hello@elyphant.ai>",
      to: [recipientEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    // Track email in analytics
    try {
      await supabase
        .from('email_analytics')
        .insert({
          recipient_email: recipientEmail,
          template_type: notificationType,
          delivery_status: 'sent',
          resend_message_id: emailResponse.data?.id,
          sent_at: new Date().toISOString()
        });
    } catch (analyticsError) {
      console.warn('⚠️ Failed to track email analytics:', analyticsError);
      // Don't fail the email send if analytics tracking fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email notification sent successfully",
      recipientEmail,
      subject,
      type: notificationType,
      emailId: emailResponse.data?.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-email-notification function:", error);
    
    // Handle Resend-specific errors
    if (error.message?.includes('API key') || error.message?.includes('Resend')) {
      return new Response(
        JSON.stringify({ 
          error: "Email service temporarily unavailable",
          details: "Please try again in a few minutes"
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (error.message?.includes('domain')) {
      return new Response(
        JSON.stringify({ 
          error: "Email domain not verified. Please verify your domain in Resend." 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: "Failed to send email notification",
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