
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

// Function to check if a code is valid
const isValidVerificationCode = async (email: string, code: string): Promise<{ 
  valid: boolean; 
  reason?: string;
  codeId?: string;
}> => {
  try {
    console.log(`Checking code ${code} for email ${email}`);
    
    // For testing purposes, accept test codes in non-production environments
    if (code === "123456" && Deno.env.get("ENVIRONMENT") !== "production") {
      console.log("Accepting test code 123456");
      return { valid: true };
    }
    
    // Get the verification code from database
    const { data: codeData, error } = await supabase
      .from("verification_codes")
      .select("id, code, expires_at, used, attempts")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .single();
    
    if (error) {
      console.log("Error fetching verification code:", error.message);
      return { valid: false, reason: "invalid" };
    }
    
    if (!codeData) {
      console.log("No verification code found for email:", email);
      return { valid: false, reason: "invalid" };
    }
    
    // Check if code is expired
    if (new Date(codeData.expires_at) < new Date()) {
      console.log("Verification code expired for email:", email);
      
      // Update attempts count
      await supabase
        .from("verification_codes")
        .update({ attempts: codeData.attempts + 1 })
        .eq("id", codeData.id);
        
      return { valid: false, reason: "expired" };
    }
    
    // Update the code as used
    const { error: updateError } = await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("id", codeData.id);
    
    if (updateError) {
      console.log("Error updating verification code:", updateError);
      // Still consider valid but log the error
    }
    
    console.log("Verification code valid");
    return { valid: true, codeId: codeData.id };
    
  } catch (error) {
    console.error("Error validating code:", error);
    return { valid: false, reason: "error" };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse JSON body
    let body;
    try {
      body = await req.json();
      console.log("Received body:", JSON.stringify(body));
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body", 
          success: false
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, code } = body;
    
    console.log("Received verification request:", { email, code });
    
    if (!email || !code) {
      return new Response(
        JSON.stringify({ 
          error: "Email and code are required", 
          success: false 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    console.log(`Attempting to verify code ${code} for email ${email}`);
    
    // Verify the code format first
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      console.error("Invalid code format:", code);
      return new Response(
        JSON.stringify({ 
          error: "Invalid verification code format. Must be 6 digits.", 
          success: false,
          reason: "format"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Check if the code is valid
    const { valid, reason } = await isValidVerificationCode(email, code);
    
    if (!valid) {
      console.error(`Invalid or expired verification code (${reason}):`, code);
      
      // Increment attempts in the database
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
      
      return new Response(
        JSON.stringify({ 
          error: reason === "expired" 
            ? "Verification code has expired" 
            : "Invalid verification code", 
          success: false,
          reason: reason || "invalid"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // If the verification was successful, mark the user's email as confirmed
    const { data: userData, error: userError } = await supabase.auth
      .admin
      .getUserByEmail(email);
    
    if (userError) {
      console.error("Error fetching user:", userError);
    } else if (userData?.user) {
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
    
    console.log("Email verified successfully for", email);
    return new Response(
      JSON.stringify({ 
        message: "Email verified successfully", 
        success: true 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
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
