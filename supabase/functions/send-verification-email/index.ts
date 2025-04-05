
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
    
    const { email, name, verificationUrl } = body as EmailVerificationRequest;

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Verification URL provided: ${verificationUrl}`);
    
    // Format the redirect URL correctly
    const baseUrl = verificationUrl.endsWith('/') ? verificationUrl.slice(0, -1) : verificationUrl;
    const redirectTo = `${baseUrl}/sign-up?verified=true&email=${encodeURIComponent(email)}`;
    console.log(`Final redirect URL: ${redirectTo}`);

    const { data: signUpData, error: signUpError } = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/generate-link`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": `${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({
          type: "signup",
          email: email,
          options: {
            redirect_to: redirectTo
          }
        })
      }
    ).then(res => res.json());

    if (signUpError) {
      throw new Error(`Failed to generate verification link: ${signUpError.message}`);
    }

    // Use the generated action link which contains the proper access_token
    const actionLink = signUpData?.action_link;
    
    if (!actionLink) {
      throw new Error("Failed to generate verification link");
    }

    console.log(`Generated action link: ${actionLink}`);

    const emailResponse = await resend.emails.send({
      from: "Elyphant <onboarding@resend.dev>", 
      to: [email],
      subject: "Verify your Elyphant account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #8a4baf;">Welcome to Elyphant! 🐘</h1>
          </div>
          <p>Hi ${name || "there"},</p>
          <p>Thanks for signing up with Elyphant! We're excited to have you join our community of gift-givers and wish-makers.</p>
          <p>Please verify your email address to continue:</p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="${actionLink}" style="background-color: #8a4baf; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify my email
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4a4a4a; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${actionLink}</p>
          <p>If you didn't create an account with us, you can safely ignore this email.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6b6b6b; font-size: 12px; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} Elyphant. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    
    // Return a more detailed error response
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
