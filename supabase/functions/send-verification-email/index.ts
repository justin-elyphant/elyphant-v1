
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

/**
 * Main request handler for the edge function
 */
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await parseRequestBody(req);
    if (!body.valid) {
      return createErrorResponse(body.error || "Invalid request", undefined, body.status);
    }
    
    const { email, name, useVerificationCode = true } = body.data;
    console.log("Request received for:", { email, name: name || "[NOT PROVIDED]", useVerificationCode });

    // ENHANCED LOGGING: Log environment information
    const environment = Deno.env.get("ENVIRONMENT") || "development";
    console.log(`📝 ENVIRONMENT CHECK: Currently running in '${environment}' environment`);
    
    // ENHANCED LOGGING: Detailed test email check
    console.log(`📧 TEST EMAIL CHECK: Checking if '${email}' is a test email...`);
    const isTest = isTestEmail(email);
    console.log(`📧 TEST EMAIL RESULT: '${email}' ${isTest ? 'IS' : 'is NOT'} a test email`);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Store verification code in database
    const storedCode = await storeVerificationCode(email, verificationCode);
    
    if (!storedCode) {
      return createRateLimitErrorResponse();
    }

    console.log(`Generated verification code for ${email}: ${verificationCode}`);
    
    // For backup/debugging in development environments, allow test code 123456
    if (environment !== "production") {
      console.log("For testing: verification code 123456 will also work during development");
      
      // Store test code in database too
      await storeVerificationCode(email, "123456");
    }
    
    // ENHANCED LOGGING: Bypass check
    const shouldBypass = isTest && environment !== "production";
    console.log(`🔍 BYPASS CHECK: Should bypass email sending? ${shouldBypass ? 'YES' : 'NO'}`);
    console.log(`🔍 BYPASS DETAILS: isTest=${isTest}, environment=${environment}, notProduction=${environment !== "production"}`);
    
    // Send email with retry logic
    const emailResult = await sendEmailWithRetry(email, name, verificationCode);
    
    if (!emailResult.success) {
      return handleEmailSendingError(emailResult.error);
    }

    return createSuccessResponse(emailResult.data);
    
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

/**
 * Parse and validate request body
 */
async function parseRequestBody(req: Request): Promise<{ 
  valid: boolean; 
  data?: any; 
  error?: string;
  status?: number;
}> {
  const contentType = req.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {
      valid: false, 
      error: "Content-Type must be application/json", 
      status: 400
    };
  }
  
  try {
    const body = await req.json();
    console.log("Request body:", JSON.stringify({
      email: body.email,
      name: body.name || "[NOT PROVIDED]",
      verificationUrl: body.verificationUrl || "[NOT PROVIDED]",
      useVerificationCode: body.useVerificationCode
    }));
    
    if (!body.email) {
      return {
        valid: false,
        error: "Email is required",
        status: 400
      };
    }
    
    return { valid: true, data: body };
    
  } catch (jsonError) {
    console.error("JSON parse error:", jsonError);
    return { 
      valid: false, 
      error: "Invalid JSON in request body", 
      status: 400,
      details: jsonError.toString()
    };
  }
}

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if an email is a test email that should bypass actual sending
 */
function isTestEmail(email: string): boolean {
  if (!email) return false;
  
  const lowerEmail = email.toLowerCase();
  
  // List of test email patterns
  const testPatterns = [
    "justncmeeks",
    "test@example.com",
    "test+",
    "demo@"
  ];
  
  // ENHANCED LOGGING: Detailed pattern matching
  console.log(`🔍 TEST EMAIL PATTERNS CHECK for ${email}:`);
  for (const pattern of testPatterns) {
    const matches = lowerEmail.includes(pattern);
    console.log(`  - Pattern "${pattern}": ${matches ? 'MATCHES' : 'does not match'}`);
    if (matches) {
      console.log(`  > MATCHED PATTERN: "${pattern}" found in "${lowerEmail}"`);
    }
  }
  
  // Check if any pattern is found in the email
  const isTest = testPatterns.some(pattern => lowerEmail.includes(pattern));
  
  console.log(`Email ${email} final test status: ${isTest ? 'IS TEST EMAIL' : 'is NOT a test email'}`);
  return isTest;
}

/**
 * Store verification code in database
 */
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
      return await handleExistingCode(existingCode, email, code);
    } else {
      return await createNewVerificationCode(email, code);
    }
  } catch (error) {
    console.error("Error storing verification code:", error);
    return false;
  }
}

/**
 * Handle existing verification code
 */
async function handleExistingCode(existingCode: any, email: string, code: string): Promise<boolean> {
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
  
  return true;
}

/**
 * Create a new verification code record
 */
async function createNewVerificationCode(email: string, code: string): Promise<boolean> {
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
  
  return true;
}

/**
 * Sleep function for implementing backoff
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send email with retry logic for handling rate limits
 */
async function sendEmailWithRetry(
  email: string, 
  name: string, 
  verificationCode: string, 
  maxRetries = 3
): Promise<{success: boolean, data?: any, error?: any}> {
  let retries = 0;
  let lastError = null;
  
  // Check for test email bypass - ALWAYS RUNS FIRST
  const environment = Deno.env.get("ENVIRONMENT") || "development";
  const isEnvNotProduction = environment !== "production";
  console.log(`Current environment: ${environment}, bypass enabled: ${isEnvNotProduction}`);
  
  if (isTestEmail(email) && isEnvNotProduction) {
    console.log(`🧪 TEST EMAIL DETECTED: ${email} - Bypassing actual email send`);
    console.log(`Verification code for test account: ${verificationCode}`);
    return { 
      success: true,
      data: { id: "test-mode-email", code: verificationCode }
    };
  } else {
    console.log(`✉️ Attempting to send real email to: ${email} (not a test email or production environment)`);
  }

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1}/${maxRetries} to send email to ${email}`);
      const emailContent = createVerificationEmailContent(name, verificationCode);
      const emailResponse = await resend.emails.send({
        from: "Elyphant <onboarding@resend.dev>", 
        to: [email],
        subject: "Your Elyphant verification code",
        html: emailContent,
      });
      
      console.log("Email sent successfully:", emailResponse);
      return { success: true, data: emailResponse };
    } catch (error) {
      lastError = error;
      console.error(`Email sending attempt ${retries + 1} failed:`, error);
      
      if (isRateLimitError(error)) {
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

/**
 * Check if error is related to rate limiting
 */
function isRateLimitError(error: any): boolean {
  return error.message?.includes('429') || 
         error.message?.includes('rate') || 
         error.message?.includes('limit') ||
         error.statusCode === 429;
}

/**
 * Create HTML email content for the verification email
 */
function createVerificationEmailContent(name: string, verificationCode: string): string {
  return `
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
}

/**
 * Create success response
 */
function createSuccessResponse(data: any): Response {
  return new Response(JSON.stringify({ 
    success: true, 
    data: data,
    codeGenerated: true
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * Create error response
 */
function createErrorResponse(message: string, reason?: string, status = 400): Response {
  return new Response(
    JSON.stringify({ 
      error: message, 
      success: false,
      reason: reason || "error"
    }),
    {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

/**
 * Create rate limit error response
 */
function createRateLimitErrorResponse(): Response {
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

/**
 * Handle email sending error
 */
function handleEmailSendingError(error: any): Response {
  console.error("Failed to send email after retries:", error);
  
  // Check if it's a rate limit issue
  if (error?.statusCode === 429 || 
      error?.message?.includes('rate') ||
      error?.message?.includes('limit')) {
    return new Response(
      JSON.stringify({ 
        error: "Email service rate limit reached. Please try again later.",
        success: false,
        rateLimited: true,
        details: error
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
      details: error
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

serve(handler);
