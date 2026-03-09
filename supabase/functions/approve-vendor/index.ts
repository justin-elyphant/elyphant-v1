
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user-scoped client to identify the caller
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller has employee or admin role
    const { data: hasEmployeeRole } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "employee",
    });
    const { data: hasAdminRole } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!hasEmployeeRole && !hasAdminRole) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Employee or admin role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { vendor_account_id, action } = await req.json();

    if (!vendor_account_id || !["approved", "rejected", "suspended"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload. Required: vendor_account_id, action (approved|rejected|suspended)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch vendor account
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from("vendor_accounts")
      .select("id, user_id, approval_status, contact_email, company_name")
      .eq("id", vendor_account_id)
      .single();

    if (vendorError || !vendor) {
      return new Response(
        JSON.stringify({ error: "Vendor account not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update approval status
    const { error: updateError } = await supabaseAdmin
      .from("vendor_accounts")
      .update({
        approval_status: action,
        approved_by: action === "approved" ? user.id : vendor.approved_by,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendor_account_id);

    if (updateError) {
      console.error("Failed to update vendor status:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update vendor status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Role management
    if (action === "approved") {
      // Insert vendor role (upsert to avoid duplicates)
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          {
            user_id: vendor.user_id,
            role: "vendor" as any,
            granted_by: user.id,
            granted_at: new Date().toISOString(),
          },
          { onConflict: "user_id,role" }
        );

      if (roleError) {
        console.error("Failed to assign vendor role:", roleError);
        // Non-fatal — status was already updated
      }

      // Auto-confirm vendor's email so they can log in immediately
      try {
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
          vendor.user_id,
          { email_confirm: true }
        );
        if (confirmError) {
          console.error("Non-fatal: failed to auto-confirm vendor email:", confirmError);
        } else {
          console.log(`✅ Auto-confirmed email for vendor user ${vendor.user_id}`);
        }
      } catch (confirmErr) {
        console.error("Non-fatal: email confirmation failed:", confirmErr);
      }
    } else if (action === "suspended" || action === "rejected") {
      // Remove vendor role
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", vendor.user_id)
        .eq("role", "vendor");
    }

    console.log(`Vendor ${vendor_account_id} ${action} by ${user.id}`);

    // Send notification email (non-fatal)
    if ((action === "approved" || action === "rejected") && vendor.contact_email) {
      try {
        const eventType = action === "approved"
          ? "vendor_application_approved"
          : "vendor_application_rejected";

        const { error: emailError } = await supabaseAdmin.functions.invoke(
          "ecommerce-email-orchestrator",
          {
            body: {
              eventType,
              recipientEmail: vendor.contact_email,
              data: { company_name: vendor.company_name },
            },
          }
        );

        if (emailError) {
          console.error(`Non-fatal: failed to send ${eventType} email:`, emailError);
        } else {
          console.log(`📧 Sent ${eventType} email to ${vendor.contact_email}`);
        }
      } catch (emailErr) {
        console.error("Non-fatal: email trigger failed:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, action, vendor_account_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("approve-vendor error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
