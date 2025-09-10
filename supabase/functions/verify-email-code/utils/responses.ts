
import { corsHeaders } from "./cors.ts";

/**
 * Create error response
 */
export function createErrorResponse(message: string, reason?: string, status = 400): Response {
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
export function createSuccessResponse(message: string, data = {}): Response {
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
