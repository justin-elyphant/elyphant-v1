/**
 * Privacy-aware profile access helpers.
 *
 * SECURITY: Sensitive profile columns (email, dob, birth_year, shipping_address,
 * ai_interaction_data, enhanced_ai_interaction_data, gifting_history,
 * enhanced_gifting_history, signup_metadata, source_attribution, signup_source)
 * have been REVOKEd from the `authenticated` and `anon` roles at the
 * column-grant level. Direct `SELECT *` on `public.profiles` will FAIL for
 * authenticated users.
 *
 * Use these helpers instead:
 *  - PROFILE_PUBLIC_COLUMNS: column list safe to use in `.select(...)`.
 *  - fetchMyPrivateProfile(): owner-only RPC returning the sensitive columns
 *    for the currently authenticated user (auth.uid() scoped server-side).
 *  - fetchMyFullProfile(): convenience that returns merged public + private
 *    fields for the current user.
 *  - fetchMyPendingConnection(connectionId): inviter-only RPC for pending
 *    recipient PII (pending_recipient_email/phone/dob, pending_shipping_address).
 *
 * For other users' profiles, only PROFILE_PUBLIC_COLUMNS is readable.
 */

import { supabase } from "@/integrations/supabase/client";

// All columns the `authenticated` role still has SELECT on for `public.profiles`.
// Keep this list in sync with the column-level REVOKE migration.
export const PROFILE_PUBLIC_COLUMNS = [
  "id",
  "username",
  "name",
  "first_name",
  "last_name",
  "bio",
  "profile_image",
  "profile_type",
  "user_type",
  "interests",
  "gift_preferences",
  "enhanced_gift_preferences",
  "gift_giving_preferences",
  "important_dates",
  "wishlists",
  "has_given_gifts",
  "has_purchased",
  "has_wishlist",
  "onboarding_completed",
  "address_last_updated",
  "address_verification_method",
  "address_verified",
  "address_verified_at",
  "city",
  "state",
  "metadata",
  "created_at",
  "updated_at",
].join(", ");

export interface PrivateProfileFields {
  email: string | null;
  dob: string | null;
  birth_year: number | null;
  shipping_address: any | null;
  ai_interaction_data: any | null;
  enhanced_ai_interaction_data: any | null;
  gifting_history: any | null;
  enhanced_gifting_history: any | null;
  signup_metadata: any | null;
  source_attribution: any | null;
  signup_source: string | null;
}

/**
 * Owner-only fetch of sensitive profile fields for the currently authenticated
 * user. Returns null if not signed in or no row matches auth.uid().
 */
export async function fetchMyPrivateProfile(): Promise<PrivateProfileFields | null> {
  const { data, error } = await supabase.rpc("get_my_profile_private");
  if (error) {
    console.error("fetchMyPrivateProfile error:", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as PrivateProfileFields) ?? null;
}

/**
 * Convenience: fetch the current user's full profile (public columns + the
 * private columns via the SECURITY DEFINER RPC) and merge.
 */
export async function fetchMyFullProfile(userId: string) {
  const [publicResp, privateData] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_PUBLIC_COLUMNS)
      .eq("id", userId)
      .maybeSingle(),
    fetchMyPrivateProfile(),
  ]);

  if (publicResp.error) {
    return { data: null, error: publicResp.error };
  }
  if (!publicResp.data) {
    return { data: null, error: null };
  }
  return {
    data: { ...(publicResp.data as any), ...(privateData ?? {}) },
    error: null,
  };
}

export interface PendingConnectionFields {
  pending_recipient_email: string | null;
  pending_recipient_phone: string | null;
  pending_recipient_dob: string | null;
  pending_shipping_address: any | null;
}

/**
 * Inviter-only fetch of pending recipient PII for a connection row the caller
 * owns (server-side enforced via auth.uid() = user_connections.user_id).
 */
export async function fetchMyPendingConnection(
  connectionId: string
): Promise<PendingConnectionFields | null> {
  const { data, error } = await supabase.rpc("get_my_pending_connection", {
    _connection_id: connectionId,
  });
  if (error) {
    console.error("fetchMyPendingConnection error:", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as PendingConnectionFields) ?? null;
}
