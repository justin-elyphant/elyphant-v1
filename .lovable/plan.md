

## Pre-Beta Security Hardening Plan

Three phases, ordered by severity. Each phase is a single migration + associated code changes.

---

### Phase 1 -- Fix Critical Security Vulnerabilities

The security scan found 12 ERROR-level findings. These are exploitable today.

| Table | Vulnerability | Fix |
|-------|--------------|-----|
| `password_reset_tokens` | Plaintext tokens + emails readable by anyone (account takeover) | Drop open policy, add service_role-only ALL |
| `email_approval_tokens` | All tokens readable/writable by anyone | Drop open policy, add service_role-only ALL |
| `email_delivery_logs` | Fully open to public | Drop open policy, add service_role-only ALL |
| `pricing_settings` | Anyone can change markup rates and fees | Drop the open "Admin can manage" policy |
| `pending_gift_invitations` | All invitations + shipping addresses exposed | Drop open SELECT, replace with token-scoped lookup |
| `refund_requests` | `auth.uid() IS NULL` branch allows anonymous full access | Drop policy, add service_role-only ALL |
| `user_connections` | Pending invitations expose PII publicly | Drop open policy, scope to recipient |
| `return_events` | Admin SELECT/UPDATE both use `USING(true)` on public | Drop, replace with `is_business_admin()` scoped |
| `wishlist_item_purchases` | Purchaser identity + prices exposed to everyone | Drop open SELECT, add owner + purchaser policies |
| `product_analytics` | User IDs + session data publicly readable | Drop open SELECT |
| `profile_completion_analytics` | ALL on public with `USING(true)` | Drop, add service_role-only |
| `is_group_admin` / `is_group_member` | Parameter shadowing bug: `user_id = user_id` always true -- any user can admin any group | Rename params to `_user_id`, `_group_id` |
| Realtime channels | No RLS on `realtime.messages` -- any user can subscribe to any channel | Add topic-scoped RLS (if supported) or document as known limitation |

**One migration, ~80 lines of SQL. Zero code changes. This is the urgent one.**

---

### Phase 2 -- Consolidate RLS + Fix Function Search Paths

**2a. `privacy_settings` has 6 overlapping policies.** Consolidate to 3:
- Owner ALL (authenticated, `auth.uid() = user_id`)
- Public INSERT for onboarding trigger (`WITH CHECK auth.uid() = user_id`)
- Business admin SELECT for support

**2b. Fix 4 functions with missing `search_path`:**
- `increment_group_gift_amount`
- `decay_product_freshness`
- `track_wishlist_purchase_and_notify`
- `get_upcoming_auto_gift_events`

**One migration, ~30 lines. Zero code changes.**

---

### Phase 3 -- Code + Schema Cleanup

**3a.** Drop the old `complete_onboarding` overload that still accepts `p_data_sharing_settings` (DB still has both overloads).

**3b.** Remove residual `data_sharing_settings` references from:
- `profileSchema.ts` -- delete `dataSharingSchema` and field
- `ProfileDataValidator.ts` -- remove the `.optional()` field
- `types.ts` -- will auto-update on next type regeneration

**3c.** Tighten `conversation_threads` -- the `user_id IS NULL` branch lets anonymous users read all unowned threads.

**~15 lines SQL + 3 code files.**

---

### Execution Order

All three phases can run in a single session. Phase 1 is the critical priority -- it contains account takeover vectors via exposed password reset tokens and privilege escalation via the group function bug.

### Technical Details

- The `is_group_admin`/`is_group_member` bug: both functions declare a parameter `user_id` which shadows the `group_chat_members.user_id` column, so `WHERE user_id = user_id` compares the column to itself (always true). Fix is renaming to `_user_id`.
- The `refund_requests` policy has `(auth.uid() IS NULL OR EXISTS(...))` -- when unauthenticated, `auth.uid() IS NULL` is true, granting full access.
- Two `complete_onboarding` overloads exist in the DB; the old one with `p_data_sharing_settings` must be dropped explicitly by matching its full signature.
- Realtime RLS is a Supabase platform limitation -- we cannot add policies to `realtime.messages`. This will be documented as a known limitation with a mitigation note.

