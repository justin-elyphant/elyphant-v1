
import { generateVerificationCode, isTestEmail } from "../utils/verification.ts";
import { storeVerificationCode } from "../services/dbService.ts";
import { sendEmailWithRetry } from "../utils/email.ts";
import { 
  createSuccessResponse, 
  createErrorResponse,
  createRateLimitErrorResponse
} from "../utils/responses.ts";
import { corsHeaders } from "../utils/cors.ts";

/**
 * Handle email verification requests
 */
export const handleVerificationEmail = async (req: Request): Promise<Response> => {
  console.log("---------------------------------------");
  console.log(`Send verification email function called: ${new Date().toISOString()}`);
  console.log(`Current environment: ${Deno.env.get("ENVIRONMENT") || "not set"}`);
  console.log("---------------------------------------");
  
  try {
    // Validate request method
    if (req.method !== "POST") {
      console.error(`Invalid method: ${req.method}`);
      return createErrorResponse("Method not allowed. Use POST.", "method_error", 405);
    }
    
    // Validate content type
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`Invalid content type: ${contentType}`);
      return createErrorResponse("Content-Type must be application/json", "content_type_error", 400);
    }
    
    // Parse request body
    let data: any;
    try {
      data = await req.json();
      console.log("Request body received:", {
        email: data.email ? `${data.email.substring(0, 3)}...` : undefined, // Partial logging for privacy
        name: data.name ? `${data.name.substring(0, 3)}...` : undefined,
        hasVerificationUrl: !!data.verificationUrl,
        useVerificationCode: !!data.useVerificationCode,
      });
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return createErrorResponse(`Invalid JSON in request body: ${error}`, "json_parse_error", 400);
    }
    
    // Validate required fields
    const { email, name } = data;
    if (!email) {
      console.error("Missing email in request");
      return createErrorResponse("Email is required", "missing_email", 400);
    }
    
    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();
    console.log(`Normalized email: ${normalizedEmail.substring(0, 3)}...`);
    
    // EARLY TEST BYPASS: Check if this is a test email right away
    if (normalizedEmail.toLowerCase().includes("justncmeeks") || normalizedEmail.toLowerCase().includes("test@example")) {
      console.log(`🚨 EARLY BYPASS: Test email "${normalizedEmail}" detected at top of function`);
      const earlyBypassCode = generateVerificationCode();
      console.log(`Generated early bypass code: ${earlyBypassCode}`);
      
      // Store the code for consistency even in bypass mode
      try {
        const stored = await storeVerificationCode(normalizedEmail, earlyBypassCode);
        console.log(`Test code storage result: ${stored ? 'SUCCESS' : 'FAILED'}`);
        
        if (!stored) {
          console.error(`⚠️ Failed to store test verification code for ${normalizedEmail}`);
          // Continue anyway for test emails
        }
      } catch (error) {
        console.error("Error storing code in early bypass:", error);
        // Continue anyway for test emails
      }
      
      return createSuccessResponse({
        message: "🚫 Bypass triggered at top of function",
        code: earlyBypassCode,
        testBypass: true,
        environment: Deno.env.get("ENVIRONMENT") || "not set"
      });
    }
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    console.log(`Generated verification code for ${normalizedEmail}: ${verificationCode}`);
    
    // Store verification code
    // This also handles rate limiting checks
    console.log(`Attempting to store code for ${normalizedEmail}`);
    const codeStored = await storeVerificationCode(normalizedEmail, verificationCode);
    if (!codeStored) {
      console.warn(`Rate limit or storage error for ${normalizedEmail}`);
      return createRateLimitErrorResponse();
    }
    
    // Check if this is a test email - if so, bypass actual sending
    const testMode = isTestEmail(normalizedEmail);
    const isDevEnv = Deno.env.get("ENVIRONMENT") === "development";
    
    console.log(`Test email check: email=${normalizedEmail}, testMode=${testMode}, env=${isDevEnv ? "development" : "production"}`);
    
    if (testMode) {
      console.log(`🚫 Test email detected: ${normalizedEmail} - BYPASSING EMAIL SEND in ALL environments`);
      // For test emails, always bypass the actual email sending and just return the code
      return createSuccessResponse({
        message: "Verification code stored but email not sent (test email bypass)",
        code: verificationCode,
        testBypass: true,
        environment: Deno.env.get("ENVIRONMENT") || "not set"
      });
    }
    
    // Only proceed with sending an email for non-test email addresses
    try {
      console.log(`📧 Sending verification email to ${normalizedEmail}`);
      const emailResult = await sendEmailWithRetry(normalizedEmail, name || normalizedEmail, verificationCode);
      
      if (!emailResult.success) {
        console.error(`❌ Failed to send email to ${normalizedEmail}:`, emailResult.error);
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
      
      console.log(`✅ Email successfully sent to ${normalizedEmail}`);
      return createSuccessResponse({
        message: "Verification code sent successfully"
      });
    } catch (error) {
      console.error(`Error sending email to ${normalizedEmail}:`, error);
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
  } catch (error) {
    console.error("Unexpected error in handleVerificationEmail:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        success: false,
        details: error
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};
