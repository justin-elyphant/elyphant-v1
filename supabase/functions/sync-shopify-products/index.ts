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
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create anon client to verify user identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user is a vendor
    const { data: vendorAccount, error: vendorError } = await anonClient
      .from("vendor_accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (vendorError || !vendorAccount) {
      return new Response(JSON.stringify({ error: "Vendor account not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "No product rows provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure all rows belong to this vendor (prevent cross-vendor writes)
    const sanitizedRows = rows.map((row: any) => ({
      ...row,
      vendor_account_id: vendorAccount.id,
    }));

    // Use service role client to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    let synced = 0;
    const errors: string[] = [];

    for (const row of sanitizedRows) {
      const { error } = await serviceClient
        .from("products")
        .upsert(row, { onConflict: "product_id" });

      if (error) {
        console.error("Upsert error for", row.product_id, error);
        errors.push(`${row.product_id}: ${error.message}`);
      } else {
        synced++;
      }
    }

    return new Response(
      JSON.stringify({ synced, total: sanitizedRows.length, errors }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("sync-shopify-products error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
