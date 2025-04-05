
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
    let body;
    try {
      body = await req.json();
      console.log("Create user request received:", JSON.stringify({
        ...body,
        password: body.password ? "[REDACTED]" : undefined // Don't log the actual password
      }));
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body format",
          success: false
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    const { email, password, name, invitedBy = null, senderUserId = null } = body as CreateUserRequest;
    
    // Validate required fields
    if (!email || !password) {
      const missingFields = [];
      if (!email) missingFields.push("email");
      if (!password) missingFields.push("password");
      
      console.error(`Missing required fields: ${missingFields.join(", ")}`);
      
      return new Response(
        JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(", ")}`,
          success: false
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get needed environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Check environment variables
    if (!SUPABASE_URL) {
      console.error("Missing SUPABASE_URL environment variable");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing SUPABASE_URL",
          success: false
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing service role key",
          success: false
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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
    
    // Handle non-200 responses from Supabase
    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.text();
      console.error(`Failed to create user: Status ${createUserResponse.status}`, errorData);
      
      // Try to parse the error as JSON if possible
      let parsedError;
      try {
        parsedError = JSON.parse(errorData);
      } catch (e) {
        // If it's not valid JSON, use the raw text
        parsedError = { message: errorData };
      }
      
      // Return specific error message for common cases
      if (errorData.includes("already registered")) {
        return new Response(
          JSON.stringify({ 
            error: "Email already registered",
            code: "user_exists",
            success: false,
            status: createUserResponse.status,
            details: parsedError
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to create user: ${errorData.substring(0, 500)}`,
          success: false,
          status: createUserResponse.status,
          details: parsedError
        }),
        {
          status: createUserResponse.status >= 400 && createUserResponse.status < 600 
            ? createUserResponse.status 
            : 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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
        success: false,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
