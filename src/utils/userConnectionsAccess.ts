/**
 * Privacy-aware connection access helpers.
 *
 * SECURITY: The pending_recipient_email, pending_recipient_phone,
 * pending_recipient_dob and pending_shipping_address columns on
 * `public.user_connections` have been REVOKEd from `authenticated` and `anon`.
 * `SELECT *` on `user_connections` will FAIL for authenticated callers.
 *
 * Use USER_CONNECTIONS_PUBLIC_COLUMNS in `.select(...)` and the
 * `fetchMyPendingConnection(connectionId)` RPC helper (in
 * `profilePrivateAccess.ts`) for owner-only pending recipient PII.
 */

// All columns the `authenticated` role still has SELECT on for `user_connections`.
// Declared as a string literal so PostgREST type inference produces the correct row shape.
export const USER_CONNECTIONS_PUBLIC_COLUMNS =
  "id, user_id, connected_user_id, status, relationship_type, relationship_context, follow_type, data_access_permissions, gift_occasion, gift_message, has_pending_gift, invitation_token, invitation_sent_at, invitation_reminder_count, last_reminder_sent_at, pending_recipient_name, accepted_at, blocked_at, blocked_by, created_at, updated_at" as const;
