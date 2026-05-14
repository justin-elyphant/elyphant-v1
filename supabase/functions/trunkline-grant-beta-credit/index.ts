import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GrantRequest {
  user_id: string;
  amount?: number;
  description?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid authorization");

    const { data: admin } = await supabase
      .from("business_admins")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: GrantRequest = await req.json();
    const { user_id, amount = 100, description } = body;
    if (!user_id) throw new Error("user_id required");
    if (amount <= 0 || amount > 500) throw new Error("Amount must be between 1 and 500");

    // Idempotency: prevent duplicate manual welcome grants
    const { data: existing } = await supabase
      .from("beta_credits")
      .select("id")
      .eq("user_id", user_id)
      .eq("type", "welcome")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "User already has a welcome beta credit" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: credit, error: insertError } = await supabase
      .from("beta_credits")
      .insert({
        user_id,
        amount,
        type: "welcome",
        description: description || `Manual beta tester credit granted via Trunkline`,
        issued_by: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, credit }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("trunkline-grant-beta-credit error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
