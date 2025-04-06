
import { createSuccessResponse, createErrorResponse, createRateLimitErrorResponse, handleEmailSendingError } from "../utils/responses.ts";
import { generateVerificationCode, isTestEmail } from "../utils/verification.ts";
import { storeVerificationCode } from "../services/dbService.ts";
import { sendEmailWithRetry } from "../utils/email.ts";
import { corsHeaders } from "../utils/cors.ts";

/**
 * Main handler for verification email requests
 */
export async function handleVerificationEmail(req: Request): Promise<Response> {
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
  
  // CRITICAL: Test email bypass check - Must run BEFORE any other logic
  // This ensures test emails never hit rate limits or actual email services
  const shouldBypass = isTest && environment !== "production";
  console.log(`🔍 BYPASS CHECK: Should bypass email sending? ${shouldBypass ? 'YES' : 'NO'}`);
  console.log(`🔍 BYPASS DETAILS: isTest=${isTest}, environment=${environment}, notProduction=${environment !== "production"}`);
  
  if (shouldBypass) {
    console.log(`🧪 TEST EMAIL DETECTED: ${email} - Bypassing all remaining logic`);
    
    // Generate verification code for test accounts
    const verificationCode = generateVerificationCode();
    console.log(`Test verification code generated: ${verificationCode}`);
    
    // For test accounts in dev/staging, also store code 123456 as fallback
    if (environment === "development" || environment === "staging") {
      console.log("For testing: verification code 123456 will also work");
      await storeVerificationCode(email, "123456");
    }
    
    // Store the real verification code too
    await storeVerificationCode(email, verificationCode);
    
    // Return success with the code directly (only for test emails in non-production)
    console.log(`Returning test mode response with code: ${verificationCode}`);
    return createSuccessResponse({ 
      id: "test-mode-email", 
      code: verificationCode,
      testBypass: true
    });
  }

  // Handle regular email flow (non-test emails)
  return await handleRegularEmail(email, name, environment);
}

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
 * Handle regular (non-test) email verification flow
 */
async function handleRegularEmail(
  email: string, 
  name: string, 
  environment: string
): Promise<Response> {
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
  
  // Send email with retry logic
  const emailResult = await sendEmailWithRetry(email, name, verificationCode);
  
  if (!emailResult.success) {
    return handleEmailSendingError(emailResult.error);
  }

  return createSuccessResponse(emailResult.data);
}
