import { supabase } from "@/integrations/supabase/client";

/**
 * Processes the invite-link auto-connect and beta referral creation.
 * Called after onboarding completes (both instant-confirm and email-confirm flows).
 *
 * Reads `elyphant_invite_user` from localStorage. If present and different
 * from the current user, auto-connects them and creates a beta_referrals record.
 */
export async function processInviteReferral(currentUserId: string, currentUserEmail: string, inviterIdOverride?: string): Promise<void> {
  const storedInviteUser = inviterIdOverride || localStorage.getItem("elyphant_invite_user");
  if (!storedInviteUser || storedInviteUser === currentUserId) {
    return;
  }

  console.log("[processInviteReferral] Processing invite auto-connect for inviter:", storedInviteUser);

  try {
    const { sendConnectionRequest, acceptConnectionRequest } = await import(
      "@/services/connections/connectionService"
    );

    const result = await sendConnectionRequest(storedInviteUser, "friend");
    if (!result.success || !result.data?.id) {
      console.error("[processInviteReferral] Connection request failed:", result);
      return;
    }

    // Auto-accept the connection
    await acceptConnectionRequest(result.data.id);
    console.log("[processInviteReferral] Auto-connect successful, connection ID:", result.data.id);

    // Check referrer's remaining invites before creating referral
    let referrerHasInvites = true;
    try {
      const { data: remainingData } = await supabase.rpc(
        "get_remaining_invites" as any,
        { p_user_id: storedInviteUser }
      );
      const remaining = Number(remainingData);
      if (remaining === 0) {
        referrerHasInvites = false;
        console.warn("[processInviteReferral] Referrer has no remaining invites, skipping referral creation");
      }
    } catch (checkErr) {
      console.error("[processInviteReferral] Error checking remaining invites:", checkErr);
    }

    if (referrerHasInvites) {
      try {
        await supabase.from("beta_referrals").insert({
          referrer_id: storedInviteUser,
          referred_id: currentUserId,
          referred_email: currentUserEmail,
          connection_id: result.data.id,
          status: "pending_approval",
          reward_amount: 100,
        });
        console.log("[processInviteReferral] Beta referral record created");

        // Notify admin to approve the $100 credit
        try {
          const { data: referrerProfile } = await supabase
            .from("profiles")
            .select("name, username, email")
            .eq("id", storedInviteUser)
            .single();

          await supabase.functions.invoke("ecommerce-email-orchestrator", {
            body: {
              eventType: "beta_approval_needed",
              recipientEmail: "justin@elyphant.com",
              data: {
                referrer_name: referrerProfile?.name || referrerProfile?.username || "Unknown",
                referrer_email: referrerProfile?.email || "",
                invitee_name: currentUserEmail,
                invitee_email: currentUserEmail,
                credit_amount: 100,
              },
            },
          });
          console.log("[processInviteReferral] Beta approval email triggered");
        } catch (emailErr) {
          console.error("[processInviteReferral] Error sending beta approval email:", emailErr);
        }
      } catch (refErr) {
        console.error("[processInviteReferral] Error creating beta referral:", refErr);
      }
    }
  } catch (err) {
    console.error("[processInviteReferral] Error auto-connecting to inviter:", err);
  } finally {
    localStorage.removeItem("elyphant_invite_user");
    localStorage.removeItem("elyphant_invite_username");
  }
}
