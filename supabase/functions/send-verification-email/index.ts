
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleVerificationEmail } from "./handlers/emailHandler.ts";
import { corsHeaders } from "./utils/cors.ts";

/**
 * Main request handler for the edge function
 */
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return await handleVerificationEmail(req);
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
