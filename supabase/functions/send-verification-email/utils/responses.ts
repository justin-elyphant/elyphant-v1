
import { corsHeaders } from "./cors.ts";

/**
 * Create success response
 */
export function createSuccessResponse(data: any): Response {
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
export function createErrorResponse(message: string, reason?: string, status = 400): Response {
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
export function createRateLimitErrorResponse(): Response {
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
export function handleEmailSendingError(error: any): Response {
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
