
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleVerificationEmail } from "./handlers/emailHandler.ts";
import { corsHeaders } from "./utils/cors.ts";

/**
 * Main request handler for the edge function
 */
const handler = async (req: Request): Promise<Response> => {
  console.log(`Function called: ${req.method} request at ${new Date().toISOString()}`);
  console.log(`Headers: ${JSON.stringify([...req.headers.entries()])}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return await handleVerificationEmail(req);
  } catch (error: any) {
    console.error("Fatal error in send-verification-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: error.toString(),
        stack: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Start the Deno server
console.log("Starting send-verification-email function");
serve(handler);
