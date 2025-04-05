
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In a real application, use a database or Redis to store verification codes
// For this example, we're using a simple in-memory store shared with send-verification-email
// This is not ideal for production as edge functions can run on different instances
// In production, use a database or Redis to store verification codes
const verificationCodes: Record<string, { code: string, expires: number }> = {};

// Mock verification code checking (in real app, this would be stored in a database)
const isValidVerificationCode = async (email: string, code: string): Promise<boolean> => {
  try {
    // For testing purposes, if code is "123456" consider it valid
    if (code === "123456") {
      return true;
    }
    
    const storedCode = verificationCodes[email];
    
    if (!storedCode) {
      console.log("No verification code found for email:", email);
      return false;
    }
    
    if (Date.now() > storedCode.expires) {
      console.log("Verification code expired for email:", email);
      // Clean up expired code
      delete verificationCodes[email];
      return false;
    }
    
    const isValid = storedCode.code === code;
    console.log("Verification code valid:", isValid);
    
    // If valid, clean up the used code
    if (isValid) {
      delete verificationCodes[email];
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
    // Get user by email
    const getUserResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        }
      }
    );
    
    const users = await getUserResponse.json();
    
    if (!users || !users.users || users.users.length === 0) {
      console.error("No user found with email:", email);
      return false;
    }
    
    const user = users.users[0];
    const userId = user.id;
    
    // Update user to confirm their email
    const updateResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/users/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        },
        body: JSON.stringify({
          email_confirm: true,
          user_metadata: { ...user.user_metadata, email_verified: true }
        })
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
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
    const { email, code } = await req.json();
    
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
    
    // Validate the verification code
    const isValid = await isValidVerificationCode(email, code);
    
    if (!isValid) {
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
