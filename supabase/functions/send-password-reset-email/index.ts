import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.1.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetEmailRequest {
  email: string;
  userName?: string;
}

const generatePasswordResetEmail = (resetLink: string, userName?: string) => {
  const displayName = userName || "there";
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        @media (max-width: 600px) {
            .container { width: 100% !important; padding: 20px !important; }
            .content { padding: 30px 20px !important; }
            .button { width: 100% !important; padding: 16px !important; }
            .header-title { font-size: 24px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" class="container">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;" class="header-title">
                🔐 Password Reset
            </h1>
            <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">
                Secure your account with a new password
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;" class="content">
            <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                Hi ${displayName}! 👋
            </h2>
            
            <p style="color: #4a5568; margin: 0 0 25px 0; font-size: 16px;">
                We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
            </p>
            
            <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px;">
                To create a new password, click the button below:
            </p>
            
            <!-- Reset Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);"
                   class="button">
                    🔑 Reset My Password
                </a>
            </div>
            
            <p style="color: #718096; margin: 30px 0 0 0; font-size: 14px; text-align: center;">
                Or copy and paste this link in your browser:
            </p>
            <p style="color: #667eea; margin: 10px 0 0 0; font-size: 14px; text-align: center; word-break: break-all; background-color: #f7fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #667eea;">
                ${resetLink}
            </p>
        </div>
        
        <!-- Security Notice -->
        <div style="background-color: #fef5e7; border-left: 4px solid #f6ad55; padding: 20px 30px; margin: 0;">
            <h3 style="color: #c05621; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                🛡️ Security Notice
            </h3>
            <ul style="color: #9c4221; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>This secure link will expire in 1 hour for your security</li>
                <li>This link can only be used once</li>
                <li>If you didn't request this reset, please contact support</li>
                <li>Never share this link with anyone</li>
            </ul>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">
                This email was sent by Elyphant
            </p>
            <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                If you're having trouble with the button above, copy and paste the URL into your web browser.
            </p>
        </div>
    </div>
</body>
</html>`;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, userName }: PasswordResetEmailRequest = await req.json();

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending password reset email to: ${email}`);

    // Try to get user's first name from profiles table
    let displayName = userName || "there";
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('email', email)
        .maybeSingle();
      
      if (profile?.first_name) {
        displayName = profile.first_name;
      }
    } catch (error) {
      console.log('Could not fetch profile for personalization:', error);
      // Fall back to username from email if no profile found
      if (!userName) {
        displayName = email.split('@')[0];
      }
    }

    // Generate our own secure token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    console.log('Generated secure reset token');
    
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        token: resetToken,
        email,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Failed to store reset token:', insertError);
      throw new Error('Failed to store reset token');
    }
    
    // Create scanner-safe link with our token
    const interstitialLink = `https://elyphant.ai/reset-password/launch?token=${resetToken}`;

    const emailResponse = await resend.emails.send({
      from: "Elyphant <hello@elyphant.ai>",
      to: [email],
      subject: "🔐 Reset Your Password - Action Required",
      html: generatePasswordResetEmail(interstitialLink, displayName),
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset email sent successfully",
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-password-reset-email function:", error);
    
    // Handle Resend-specific errors
    if (error.message?.includes("Resend")) {
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

    return new Response(
      JSON.stringify({ 
        error: "Failed to send password reset email",
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