import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    console.log(`Sending ${notificationType} email to ${recipientEmail}`);

    // Mock email sending since resend is not available
    console.log(`Would send email to: ${recipientEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Type: ${notificationType}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email notification processed (mock)",
      recipientEmail,
      subject,
      type: notificationType
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email-notification function:", error);
    
    // Handle Resend-specific errors
    if (error.message?.includes('API key')) {
      return new Response(
        JSON.stringify({ 
          error: "Email service configuration error. Please check API key." 
        }),
        {
          status: 500,
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
        error: error.message || "Failed to send email notification" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);