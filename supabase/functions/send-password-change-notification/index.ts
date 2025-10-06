import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityNotificationRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email }: SecurityNotificationRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Sending password change notification to:', email);

    const emailResponse = await resend.emails.send({
      from: "Elyphant <hello@elyphant.ai>",
      to: [email],
      subject: "Password Changed Successfully",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 24px; margin: 0;">Password Changed</h1>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Security Alert</h2>
            <p style="color: #475569; line-height: 1.6; margin: 0;">
              Your Elyphant account password was successfully changed on ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}.
            </p>
          </div>

          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 20px;">
            <p style="color: #059669; margin: 0; font-weight: 500;">
              ✓ For your security, all other active sessions have been automatically signed out.
            </p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e293b; font-size: 16px;">What happened?</h3>
            <ul style="color: #475569; line-height: 1.6;">
              <li>Your password was successfully updated</li>
              <li>All other devices were signed out for security</li>
              <li>You can now sign in with your new password</li>
            </ul>
          </div>

          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 20px;">
            <h3 style="color: #dc2626; margin-top: 0; font-size: 16px;">Didn't change your password?</h3>
            <p style="color: #7f1d1d; margin: 0;">
              If you didn't make this change, your account may be compromised. 
              <strong>Contact our support team immediately</strong> and consider enabling two-factor authentication.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://elyphant.ai/auth" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Sign In to Your Account
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              This is an automated security notification from Elyphant.<br>
              For support, contact us at support@elyphant.com
            </p>
          </div>
        </div>
      `,
    });

    console.log("Password change notification sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Security notification sent successfully",
        id: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Error in send-password-change-notification function:", error);
    
    // Handle Resend-specific errors gracefully
    if (error.message?.includes("Resend")) {
      return new Response(
        JSON.stringify({ 
          error: "Email service temporarily unavailable",
          details: "Notification could not be sent"
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to send security notification",
        details: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);