
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../utils/cors.ts";
import { createErrorResponse, createSuccessResponse } from "../utils/responses.ts";
import { isValidCodeFormat } from "../utils/validation.ts";
import { isValidVerificationCode, markCodeAsUsed } from "../services/verificationService.ts";
import { confirmUserEmail } from "../services/userService.ts";
import { trackInvalidAttempt } from "../services/trackingService.ts";

/**
 * Main request handler
 */
export const handleVerificationRequest = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`Received ${req.method} request to verify-email-code`);
    
    // Detailed request logging
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

/**
 * Handle verification process
 */
async function handleVerification(email: string, code: string): Promise<Response> {
  // Validate code format first
  if (!isValidCodeFormat(code)) {
    console.error("Invalid code format:", code);
    return createErrorResponse("Invalid verification code format. Must be 6 digits.", "format");
  }

  const { valid, reason, codeId } = await isValidVerificationCode(email, code);
  
  if (!valid) {
    // Track invalid attempt in the database
    await trackInvalidAttempt(email, code);
    
    // Return appropriate error message
    const errorMessage = reason === "expired" 
      ? "Verification code has expired" 
      : "Invalid verification code";
      
    return createErrorResponse(errorMessage, reason);
  }
  
  if (codeId) {
    // Mark code as used
    await markCodeAsUsed(codeId);
  }
  
  // If verification successful, confirm user's email
  await confirmUserEmail(email);
  
  console.log("Email verified successfully for", email);
  return createSuccessResponse("Email verified successfully");
}
