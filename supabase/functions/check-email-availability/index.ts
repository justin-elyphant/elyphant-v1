import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use the GoTrue admin API directly to check by email
    const normalizedEmail = email.toLowerCase().trim();
    
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
        },
      }
    );

    // Alternative: use the admin client to query
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check profiles table (most reliable for our app)
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileData) {
      return new Response(JSON.stringify({ available: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also check auth.users via RPC or admin API
    // Use the REST API to query auth users by email
    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(normalizedEmail)}`,
      {
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
        },
      }
    );

    if (authResponse.ok) {
      const authData = await authResponse.json();
      const users = authData?.users || [];
      const exists = users.some(
        (u: any) => u.email?.toLowerCase() === normalizedEmail
      );
      if (exists) {
        return new Response(JSON.stringify({ available: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ available: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-email-availability error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
