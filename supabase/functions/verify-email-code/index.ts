
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to check if a code is valid
// For production use, this should use a database or Redis
// For this demo, we'll use a shared global variable
const isValidVerificationCode = (email: string, code: string): boolean => {
  try {
    console.log(`Checking code ${code} for email ${email}`);
    
    // Access the global verification codes
    const GLOBAL: any = globalThis;
    if (!GLOBAL.verificationCodes) {
      GLOBAL.verificationCodes = {};
    }
    
    // For testing purposes, accept test codes
    if (code === "123456") {
      console.log("Accepting test code 123456");
      return true;
    }
    
    const storedCode = GLOBAL.verificationCodes[email];
    
    if (!storedCode) {
      console.log("No verification code found for email:", email);
      return false;
    }
    
    if (Date.now() > storedCode.expires) {
      console.log("Verification code expired for email:", email);
      // Clean up expired code
      delete GLOBAL.verificationCodes[email];
      return false;
    }
    
    const isValid = storedCode.code === code;
    console.log("Verification code valid:", isValid);
    
    // If valid, clean up the used code
    if (isValid) {
      delete GLOBAL.verificationCodes[email];
    }
    
    return isValid;
  } catch (error) {
    console.error("Error validating code:", error);
    return false;
  }
};

// Function to verify the email using Supabase admin API
const confirmUserEmail = async (email: string): Promise<boolean> => {
  try {
    console.log("Confirming email for:", email);
    
    // Get user by email
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return false;
    }
    
    const getUserResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        }
      }
    );
    
    if (!getUserResponse.ok) {
      console.error("Failed to get user:", await getUserResponse.text());
      return false;
    }
    
    const users = await getUserResponse.json();
    
    if (!users || !users.users || users.users.length === 0) {
      console.error("No user found with email:", email);
      return false;
    }
    
    const user = users.users[0];
    const userId = user.id;
    
    console.log("Found user with ID:", userId);
    
    // Update user to confirm their email
    const updateResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          email_confirm: true,
          user_metadata: { ...user.user_metadata, email_verified: true }
        })
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      console.error("Failed to update user:", errorData);
      return false;
    }
    
    console.log("User email confirmed successfully for:", email);
    return true;
  } catch (error) {
    console.error("Error confirming user email:", error);
    return false;
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
          success: false 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Check if the code is valid
    const isValid = isValidVerificationCode(email, code);
    
    if (!isValid) {
      console.error("Invalid or expired verification code:", code);
      return new Response(
        JSON.stringify({ 
          error: "Invalid or expired verification code", 
          success: false 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // If code is valid, confirm the user's email
    const confirmed = await confirmUserEmail(email);
    
    if (!confirmed) {
      console.error("Failed to verify email for", email);
      return new Response(
        JSON.stringify({ 
          error: "Failed to verify email", 
          success: false 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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
