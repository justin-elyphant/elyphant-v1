
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailVerificationRequest {
  email: string;
  name: string;
  verificationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, verificationUrl }: EmailVerificationRequest = await req.json();

    if (!email || !verificationUrl) {
      throw new Error("Email and verification URL are required");
    }

    console.log(`Sending verification email to ${email} with URL: ${verificationUrl}`);

    const emailResponse = await resend.emails.send({
      from: "Elyphant <no-reply@elyphant.app>", // Updated from 'onboarding@resend.dev'
      to: [email],
      subject: "Verify your Elyphant account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://elyphant.app/logo.png" alt="Elyphant Logo" style="max-width: 120px; height: auto;" />
          </div>
          <h1 style="color: #8a4baf; text-align: center;">Welcome to Elyphant! 🐘</h1>
          <p>Hi ${name || "there"},</p>
          <p>Thanks for signing up with Elyphant! We're excited to have you join our community of gift-givers and wish-makers.</p>
          <p>Please verify your email address to continue:</p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="${verificationUrl}" style="background-color: #8a4baf; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify my email
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4a4a4a; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
          <p>If you didn't create an account with us, you can safely ignore this email.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6b6b6b; font-size: 12px; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} Elyphant. All rights reserved.</p>
            <p>1234 Gift Street, San Francisco, CA 94103</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
