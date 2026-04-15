import { supabase } from "@/integrations/supabase/client";

/**
 * Processes invite-link auto-connect and beta referral creation
 * by calling a server-side edge function (bypasses RLS/session issues).
 */
export async function processInviteReferral(
  currentUserId: string,
  currentUserEmail: string,
  inviterIdOverride?: string
): Promise<void> {
  const storedInviteUser = inviterIdOverride || localStorage.getItem("elyphant_invite_user");
  if (!storedInviteUser || storedInviteUser === currentUserId) return;

  try {
    const { data, error } = await supabase.functions.invoke("process-invite-referral", {
      body: {
        inviter_id: storedInviteUser,
        referred_id: currentUserId,
        referred_email: currentUserEmail,
      },
    });

    if (error) {
      console.error("[processInviteReferral] Edge function error:", error);
    } else {
      console.log("[processInviteReferral] Success:", data);
    }
  } catch (err) {
    console.error("[processInviteReferral] Error:", err);
  } finally {
    localStorage.removeItem("elyphant_invite_user");
    localStorage.removeItem("elyphant_invite_username");
  }
}
