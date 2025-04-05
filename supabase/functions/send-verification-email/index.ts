
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
  useVerificationCode?: boolean;
}

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store verification codes in memory (in production, use Redis or a database)
const verificationCodes: Record<string, { code: string, expires: number }> = {};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse JSON body safely
    let body;
    const contentType = req.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        body = await req.json();
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        return new Response(
          JSON.stringify({ 
            error: "Invalid JSON in request body", 
            success: false,
            details: jsonError.toString()
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ 
          error: "Content-Type must be application/json", 
          success: false 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    const { email, name } = body as EmailVerificationRequest;

    if (!email) {
      throw new Error("Email is required");
    }
    
    // Always use verification code
    const verificationCode = generateVerificationCode();
    
    // Store the code with 15-minute expiration
    verificationCodes[email] = {
      code: verificationCode,
      expires: Date.now() + 15 * 60 * 1000
    };

    console.log(`Generated verification code for ${email}: ${verificationCode}`);
    
    const emailSubject = "Your Elyphant verification code";
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #8a4baf;">Welcome to Elyphant! 🐘</h1>
        </div>
        <p>Hi ${name || "there"},</p>
        <p>Thanks for signing up with Elyphant! We're excited to have you join our community of gift-givers and wish-makers.</p>
        <p>Here is your verification code:</p>
        <div style="margin: 20px 0; text-align: center;">
          <div style="background-color: #f5f5f5; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8a4baf;">
            ${verificationCode}
          </div>
        </div>
        <p>Enter this code on the signup page to verify your email address and continue creating your account.</p>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't create an account with us, you can safely ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6b6b6b; font-size: 12px; text-align: center;">
          <p>&copy; ${new Date().getFullYear()} Elyphant. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Elyphant <onboarding@resend.dev>", 
      to: [email],
      subject: emailSubject,
      html: emailContent,
    });

    console.log("Email sent successfully with verification code:", verificationCode);

    return new Response(JSON.stringify({ 
      success: true, 
      data: emailResponse,
      codeGenerated: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
