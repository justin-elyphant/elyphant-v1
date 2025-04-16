
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { verifyCode } from "./services/codeService.ts";
import { confirmUserEmail } from "./services/userService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();
    
    if (!email || !code) {
      return new Response(
        JSON.stringify({ verified: false, error: "Email and code are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();
    
    // Verify the code
    const isValid = await verifyCode(normalizedEmail, code);
    
    if (isValid) {
      // Update user's email confirmation status
      await confirmUserEmail(normalizedEmail);
      
      return new Response(
        JSON.stringify({ verified: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ verified: false, error: "Invalid verification code" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error) {
    console.error("Error verifying code:", error);
    
    return new Response(
      JSON.stringify({ verified: false, error: "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
