
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

// Initialize Resend with API key from environment variable
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailVerificationRequest {
  email: string;
  name: string;
  verificationUrl?: string;
  useVerificationCode?: boolean;
}

// Sleep function for implementing backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store verification code in database
async function storeVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    // Check if there's an existing code that's not expired and update resend count
    const { data: existingCode } = await supabase
      .from("verification_codes")
      .select("id, resend_count, last_resend_at")
      .eq("email", email)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingCode) {
      // Rate limiting - if last resend was less than 1 minute ago, don't allow
      if (existingCode.last_resend_at && 
          (new Date().getTime() - new Date(existingCode.last_resend_at).getTime() < 60000)) {
        console.log(`Rate limiting - last resend was less than 1 minute ago for ${email}`);
        return false;
      }

      // Check resend limit (max 5 per code)
      if (existingCode.resend_count >= 5) {
        console.log(`Resend limit reached (5) for email ${email}`);
        return false;
      }

      // Update the existing record with new resend count
      const { error: updateError } = await supabase
        .from("verification_codes")
        .update({
          code: code,
          resend_count: existingCode.resend_count + 1,
          last_resend_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Reset expiration
        })
        .eq("id", existingCode.id);
      
      if (updateError) {
        console.error("Error updating verification code:", updateError);
        return false;
      }
    } else {
      // Create a new verification code
      const { error: insertError } = await supabase
        .from("verification_codes")
        .insert({
          email: email,
          code: code,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          last_resend_at: new Date().toISOString(),
          resend_count: 0,
        });
      
      if (insertError) {
        console.error("Error inserting verification code:", insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error storing verification code:", error);
    return false;
  }
}

// Send email with retry logic for handling rate limits
async function sendEmailWithRetry(
  email: string, 
  name: string, 
  verificationCode: string, 
  maxRetries = 3
): Promise<{success: boolean, data?: any, error?: any}> {
  let retries = 0;
  let lastError = null;
  
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

  // UPDATED: Improved test email detection logic
  const isTestingEnvironment = Deno.env.get("ENVIRONMENT") !== "production";
  // Define a list of test email addresses or patterns to match
  const bypassEmails = ["justncmeeks@gmail.com", "justncmeeks@hotmail.com", "test@example.com"];
  
  // Check if the email matches any in our bypass list (checking base part before @ or + tag)
  const isTestEmail = bypassEmails.some(testEmail => {
    const [testUser] = testEmail.split('@');
    const [emailUser] = email.toLowerCase().split('@');
    // Match either the exact username or username+anything format
    return emailUser === testUser || emailUser.startsWith(`${testUser}+`);
  });
  
  if (isTestingEnvironment && isTestEmail) {
    console.log(`Test account detected: ${email} - Bypassing actual email send`);
    console.log(`Verification code for test account: ${verificationCode}`);
    return { 
      success: true,
      data: { id: "test-mode-email", code: verificationCode }
    };
  }

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1}/${maxRetries} to send email to ${email}`);
      const emailResponse = await resend.emails.send({
        from: "Elyphant <onboarding@resend.dev>", 
        to: [email],
        subject: emailSubject,
        html: emailContent,
      });
      
      console.log("Email sent successfully:", emailResponse);
      return { success: true, data: emailResponse };
    } catch (error) {
      lastError = error;
      console.error(`Email sending attempt ${retries + 1} failed:`, error);
      
      // Check if it's a rate limit error
      const isRateLimit = error.message?.includes('429') || 
                          error.message?.includes('rate') || 
                          error.message?.includes('limit') ||
                          error.statusCode === 429;
      
      if (isRateLimit) {
        const backoffTime = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(`Rate limit detected. Backing off for ${backoffTime}ms before retry.`);
        await sleep(backoffTime);
        retries++;
      } else {
        // If it's not a rate limit error, don't retry
        break;
      }
    }
  }
  
  return { success: false, error: lastError };
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
        console.log("Request body:", JSON.stringify({
          email: body.email,
          name: body.name || "[NOT PROVIDED]",
          verificationUrl: body.verificationUrl || "[NOT PROVIDED]",
          useVerificationCode: body.useVerificationCode
        }));
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
    
    const { email, name, useVerificationCode = true } = body as EmailVerificationRequest;

    if (!email) {
      throw new Error("Email is required");
    }
    
    // Generate a 6-digit verification code
    const verificationCode = generateVerificationCode();
    
    // Store verification code in database
    const storedCode = await storeVerificationCode(email, verificationCode);
    
    if (!storedCode) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to store verification code or rate limit exceeded", 
          success: false,
          codeGenerated: false,
          rateLimited: true
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Generated verification code for ${email}: ${verificationCode}`);
    
    // For backup/debugging in development environments, allow test code 123456
    if (Deno.env.get("ENVIRONMENT") !== "production") {
      console.log("For testing: verification code 123456 will also work during development");
      
      // Store test code in database too
      await storeVerificationCode(email, "123456");
    }
    
    // Send email with retry logic
    const emailResult = await sendEmailWithRetry(email, name, verificationCode);
    
    if (!emailResult.success) {
      console.error("Failed to send email after retries:", emailResult.error);
      
      // Check if it's a rate limit issue
      if (emailResult.error?.statusCode === 429 || 
          emailResult.error?.message?.includes('rate') ||
          emailResult.error?.message?.includes('limit')) {
        return new Response(
          JSON.stringify({ 
            error: "Email service rate limit reached. Please try again later.",
            success: false,
            rateLimited: true,
            details: emailResult.error
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to send verification email",
          success: false,
          details: emailResult.error
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: emailResult.data,
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
