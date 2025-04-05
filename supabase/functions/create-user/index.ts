
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  invitedBy?: string | null;
  senderUserId?: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse JSON body safely
    const body = await req.json();
    console.log("Create user request received:", JSON.stringify({
      ...body,
      password: "[REDACTED]" // Don't log the actual password
    }));
    
    const { email, password, name, invitedBy = null, senderUserId = null } = body as CreateUserRequest;
    
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Get needed environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    // Create user with the admin API
    console.log(`Creating user with email ${email} and email_confirm=true`);
    const createUserResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            invited_by: invitedBy,
            sender_user_id: senderUserId
          }
        })
      }
    );
    
    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.text();
      console.error("Failed to create user:", errorData);
      
      // Return specific error message for common cases
      if (errorData.includes("already registered")) {
        return new Response(
          JSON.stringify({ 
            error: "Email already registered",
            code: "user_exists",
            success: false
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      throw new Error(`Failed to create user: ${errorData}`);
    }
    
    const userData = await createUserResponse.json();
    console.log("User created successfully with ID:", userData.id);
    
    // Return the created user data
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-user function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
