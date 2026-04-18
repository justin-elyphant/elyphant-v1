import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { inviter_id, referred_id, referred_email } = await req.json();
    if (!inviter_id || !referred_id || !referred_email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Create auto-accepted connection
    const { data: connection, error: connErr } = await supabase
      .from("user_connections")
      .insert({
        user_id: inviter_id,
        connected_user_id: referred_id,
        status: "accepted",
        relationship_type: "friend",
      })
      .select("id")
      .single();

    if (connErr) {
      console.error("[process-invite-referral] Connection insert failed:", connErr);
      return new Response(JSON.stringify({ error: "Connection creation failed", detail: connErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[process-invite-referral] Connection created:", connection.id);

    // 2. Check referrer's remaining invites
    let hasInvites = true;
    try {
      const { data: remaining } = await supabase.rpc("get_remaining_invites", {
        p_user_id: inviter_id,
      });
      if (Number(remaining) === 0) {
        hasInvites = false;
        console.warn("[process-invite-referral] Referrer has no remaining invites");
      }
    } catch (e) {
      console.error("[process-invite-referral] Invite cap check error:", e);
    }

    if (!hasInvites) {
      return new Response(
        JSON.stringify({ success: true, connection_id: connection.id, referral_created: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Read auto-approval flag from beta_program_settings
    let autoApprove = true;
    try {
      const { data: settings } = await supabase
        .from("beta_program_settings")
        .select("auto_approve_referrals")
        .eq("id", 1)
        .single();
      if (settings && settings.auto_approve_referrals === false) {
        autoApprove = false;
      }
    } catch (e) {
      console.error("[process-invite-referral] Settings lookup error (defaulting to auto-approve):", e);
    }

    const referralStatus = autoApprove ? "signed_up" : "pending_approval";
    const CREDIT_AMOUNT = 100;

    // 4. Create beta referral (status will be flipped to credit_issued by RPC if auto-approved)
    const { data: referral, error: refErr } = await supabase
      .from("beta_referrals")
      .insert({
        referrer_id: inviter_id,
        referred_id,
        referred_email,
        connection_id: connection.id,
        status: referralStatus,
        reward_amount: CREDIT_AMOUNT,
      })
      .select("id")
      .single();

    if (refErr) {
      console.error("[process-invite-referral] Referral insert failed:", refErr);
      return new Response(
        JSON.stringify({
          success: false,
          connection_id: connection.id,
          referral_created: false,
          error: "referral_insert_failed",
          detail: refErr.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("[process-invite-referral] Beta referral created:", referral.id, "status:", referralStatus);

    // 5. Fetch referrer profile (used by both branches)
    const { data: referrerProfile } = await supabase
      .from("profiles")
      .select("name, username, email")
      .eq("id", inviter_id)
      .single();

    const referrerName = referrerProfile?.name || referrerProfile?.username || "A friend";

    // 6. Branch: auto-approve calls atomic RPC (handles pool cap, idempotency, both credits); manual notifies admin
    if (autoApprove && referral) {
      const { data: rpcResult, error: rpcErr } = await supabase.rpc(
        "process_auto_approved_referral",
        { p_referral_id: referral.id, p_credit_amount: CREDIT_AMOUNT }
      );

      if (rpcErr) {
        console.error("[process-invite-referral] RPC error:", rpcErr);
      } else {
        console.log("[process-invite-referral] RPC result:", rpcResult);
      }

      const rpcSucceeded = rpcResult && (rpcResult as any).success === true;
      const poolExhausted = rpcResult && (rpcResult as any).reason === "pool_exhausted";

      if (poolExhausted) {
        // Alert admin: pool exhausted, signup completes but no credits issued
        try {
          await supabase.functions.invoke("ecommerce-email-orchestrator", {
            body: {
              eventType: "beta_approval_needed",
              recipientEmail: "justin@elyphant.com",
              data: {
                referrer_name: referrerName,
                invitee_email: referred_email,
                alert: `🚨 Beta credit pool exhausted. ${referred_email} signed up via ${referrerName}'s link but received no credits. Reload pool in Trunkline and backfill manually.`,
              },
            },
          });
        } catch (e) {
          console.error("[process-invite-referral] Pool-exhausted admin alert failed:", e);
        }
      } else if (rpcSucceeded) {
        // Fetch invitee profile for personalized welcome email
        const { data: inviteeProfile } = await supabase
          .from("profiles")
          .select("name, username")
          .eq("id", referred_id)
          .single();

        const inviteeName = inviteeProfile?.name || inviteeProfile?.username || referred_email.split("@")[0];

        // Send beta_approved welcome email to invitee
        try {
          await supabase.functions.invoke("ecommerce-email-orchestrator", {
            body: {
              eventType: "beta_approved",
              recipientEmail: referred_email,
              data: {
                recipient_name: inviteeName,
                credit_amount: CREDIT_AMOUNT,
                referrer_name: referrerName,
              },
            },
          });
          console.log("[process-invite-referral] Welcome email sent to invitee");
        } catch (emailErr) {
          console.error("[process-invite-referral] Welcome email error:", emailErr);
        }
      }
    } else {
      // Manual approval flow: notify admin
      try {
        await supabase.functions.invoke("ecommerce-email-orchestrator", {
          body: {
            eventType: "beta_approval_needed",
            recipientEmail: "justin@elyphant.com",
            data: {
              referrer_name: referrerName,
              referrer_email: referrerProfile?.email || "",
              invitee_name: referred_email,
              invitee_email: referred_email,
              credit_amount: CREDIT_AMOUNT,
            },
          },
        });
        console.log("[process-invite-referral] Admin approval notification sent");
      } catch (emailErr) {
        console.error("[process-invite-referral] Admin email error:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        connection_id: connection.id,
        referral_created: !refErr,
        auto_approved: autoApprove,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[process-invite-referral] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
