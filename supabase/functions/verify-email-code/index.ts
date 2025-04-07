
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Check if a verification code is valid for an email
 */
const isValidVerificationCode = async (email: string, code: string): Promise<{ 
  valid: boolean; 
  reason?: string;
  codeId?: string;
}> => {
  try {
    console.log(`Checking code ${code} for email ${email}`);
    
    // Check for test code in non-production environments
    if (isTestCode(code)) {
      console.log("Accepting test code 123456");
      return { valid: true };
    }
    
    // Get the verification code from database
    const codeData = await fetchVerificationCode(email, code);
    
    if (!codeData) {
      console.log("No verification code found for email:", email, "and code:", code);
      
      // Additional debugging: check if there are any recent codes for this email
      const { data: recentCodes, error: recentError } = await supabase
        .from("verification_codes")
        .select("id, code, expires_at, created_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (recentCodes?.length) {
        console.log("Recent codes found for this email:", recentCodes.map(c => ({
          id: c.id,
          partialCode: c.code ? `${c.code.substring(0, 2)}...${c.code.substring(4)}` : 'none',
          expires_at: c.expires_at,
          created_at: c.created_at
        })));
      } else {
        console.log("No recent codes found for this email");
      }
      
      return { valid: false, reason: "invalid" };
    }
    
    console.log("Found verification code:", {
      id: codeData.id,
      expires_at: codeData.expires_at,
      used: codeData.used,
      attempts: codeData.attempts
    });
    
    // Check if code is expired
    if (isCodeExpired(codeData.expires_at)) {
      console.log("Verification code expired for email:", email);
      
      // Update attempts count
      await incrementCodeAttempts(codeData.id);
        
      return { valid: false, reason: "expired" };
    }
    
    // Mark the code as used
    await markCodeAsUsed(codeData.id);
    
    console.log("Verification code valid");
    return { valid: true, codeId: codeData.id };
    
  } catch (error) {
    console.error("Error validating code:", error);
    return { valid: false, reason: "error" };
  }
};

/**
 * Check if code is a test code (in non-production environments)
 */
function isTestCode(code: string): boolean {
  return code === "123456" && Deno.env.get("ENVIRONMENT") !== "production";
}

/**
 * Fetch verification code from database
 */
async function fetchVerificationCode(email: string, code: string) {
  console.log(`Fetching verification code from DB for email: ${email}, code: ${code}`);
  
  const { data, error } = await supabase
    .from("verification_codes")
    .select("id, code, expires_at, used, attempts")
    .eq("email", email)
    .eq("code", code)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    if (error.message.includes('No rows found')) {
      console.log(`No verification code found matching email: ${email} and code: ${code}`);
    } else {
      console.error("Error fetching verification code:", error.message);
    }
    return null;
  }
  
  return data;
}

/**
 * Check if the code has expired
 */
function isCodeExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Mark code as used in the database
 */
async function markCodeAsUsed(codeId: string): Promise<void> {
  const { error } = await supabase
    .from("verification_codes")
    .update({ used: true })
    .eq("id", codeId);
  
  if (error) {
    console.log("Error updating verification code:", error);
  }
}

/**
 * Increment the attempts count for a code
 */
async function incrementCodeAttempts(codeId: string): Promise<void> {
  const { data } = await supabase
    .from("verification_codes")
    .select("attempts")
    .eq("id", codeId)
    .single();
    
  if (data) {
    await supabase
      .from("verification_codes")
      .update({ attempts: data.attempts + 1 })
      .eq("id", codeId);
  }
}

/**
 * Update user's email confirmation status
 */
async function confirmUserEmail(email: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth
    .admin
    .getUserByEmail(email);
  
  if (userError) {
    console.error("Error fetching user:", userError);
    return;
  }
  
  if (userData?.user) {
    console.log("Setting user email as confirmed:", userData.user.id);
    const { error: updateError } = await supabase.auth
      .admin
      .updateUserById(userData.user.id, {
        email_confirm: true
      });
    
    if (updateError) {
      console.error("Error updating user's email confirmation status:", updateError);
    }
  }
}

/**
 * Validate code format (6 digits)
 */
function isValidCodeFormat(code: string): boolean {
  return code.length === 6 && /^\d{6}$/.test(code);
}

/**
 * Create error response
 */
function createErrorResponse(message: string, reason?: string, status = 400): Response {
  return new Response(
    JSON.stringify({ 
      error: message, 
      success: false,
      reason: reason || "invalid"
    }),
    {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

/**
 * Create success response
 */
function createSuccessResponse(message: string, data = {}): Response {
  return new Response(
    JSON.stringify({ 
      message, 
      success: true,
      ...data
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

/**
 * Handle verification process
 */
async function handleVerification(email: string, code: string): Promise<Response> {
  // Validate code format first
  if (!isValidCodeFormat(code)) {
    console.error("Invalid code format:", code);
    return createErrorResponse("Invalid verification code format. Must be 6 digits.", "format");
  }

  const { valid, reason } = await isValidVerificationCode(email, code);
  
  if (!valid) {
    // Track invalid attempt in the database
    await trackInvalidAttempt(email, code);
    
    // Return appropriate error message
    const errorMessage = reason === "expired" 
      ? "Verification code has expired" 
      : "Invalid verification code";
      
    return createErrorResponse(errorMessage, reason);
  }
  
  // If verification successful, confirm user's email
  await confirmUserEmail(email);
  
  console.log("Email verified successfully for", email);
  return createSuccessResponse("Email verified successfully");
}

/**
 * Track an invalid verification attempt
 */
async function trackInvalidAttempt(email: string, code: string): Promise<void> {
  // Find the verification code and increment attempts
  const { data: codeData } = await supabase
    .from("verification_codes")
    .select("id, attempts")
    .eq("email", email)
    .eq("code", code)
    .single();
  
  if (codeData) {
    await supabase
      .from("verification_codes")
      .update({ attempts: codeData.attempts + 1 })
      .eq("id", codeData.id);
  }
}

/**
 * Main request handler
 */
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`Received ${req.method} request to verify-email-code`);
    
    // Detailed request logging - as requested by user
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    // Clone the request to get the body for logging and processing
    const clonedReq = req.clone();
    const bodyText = await clonedReq.text();
    
    console.log("Raw request body:", bodyText);
    
    // Parse JSON with robust error handling
    let body;
    try {
      body = JSON.parse(bodyText || '{}');
    } catch (e) {
      console.error("Failed to parse JSON body:", e);
      return createErrorResponse("Invalid JSON format in request body", "format", 400);
    }
    
    const { email, code } = body;
    console.log("Parsed request payload:", { email, code });
    
    // Validate required fields
    if (!email) {
      console.error("Missing email in request");
      return createErrorResponse("Email is required", "missing_field", 400);
    }
    
    if (!code) {
      console.error("Missing code in request");
      return createErrorResponse("Verification code is required", "missing_field", 400);
    }
    
    // Process verification with validated payload
    console.log(`Attempting to verify code ${code} for email ${email}`);
    return await handleVerification(email, code);
    
  } catch (error: any) {
    console.error("Error in verify-email-code function:", error);
    
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
