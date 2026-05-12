# Security Hardening Plan

Addresses all findings from the current security scan, ordered by severity and risk-of-regression.

## Priority 1 — Critical (data exposure & fraud vectors)

### 1.1 Fix `profiles` public exposure via wishlist
**Problem:** RLS policy "Anyone can view discoverable profiles" returns *all* columns (including `email`, `dob`, `birth_year`, `shipping_address`) to anon + authenticated users whenever the profile owner has a public wishlist.

**Fix (DB migration):**
- Drop the broad public SELECT policy on `profiles`.
- Create `public.profiles_public` view (`security_invoker = on`) exposing only safe discovery fields: `id`, `username`, `name`, `profile_image`, `bio`.
- Keep existing owner + accepted-connection SELECT policies on `profiles` (those already allow full row access for the right people).
- Grant SELECT on `profiles_public` to anon + authenticated.

**App code impact:**
- Audit callers that read non-owner profiles for discovery/search/wishlist viewer and switch them to `profiles_public`. Owner-fetches (`UnifiedProfileService`, profile editor) stay on `profiles`.
- Files to check & update as needed: `gifteeDataService.ts`, public profile/search components, wishlist viewer.

### 1.2 Fix `pending_recipient_addresses` unowned UPDATE
**Problem:** UPDATE policy only checks token validity — any logged-in user can overwrite any pending row's shipping address.

**Fix (DB migration):**
- Replace the UPDATE policy with one that also requires `recipient_email = (select email from auth.users where id = auth.uid())` (or matches the requester).
- Tokenized anonymous updates continue via the `collect-recipient-address` edge function using the service role.

**App code impact:** None — the edge function path is unaffected.

## Priority 2 — High

### 2.1 Realtime channel authorization
**Problem:** No RLS on `realtime.messages`; any authenticated user can subscribe to any topic (e.g., other users' message channels).

**Fix (DB migration):**
- Enable RLS on `realtime.messages` and add policies scoping subscriptions by topic pattern + `auth.uid()`:
  - Direct messages: topic format `dm:<userA>:<userB>` — allow only if `auth.uid()` is one of the two.
  - Funding/contributions: allow channel only to participants/owner.
- Keep server-side broadcasts working via service role (bypasses RLS).

**App code impact:** None visible if topic naming already includes user IDs; verify topic strings used in `useRealtime*` hooks match the new policy patterns.

## Priority 3 — Medium (Supabase linter)

### 3.1 SECURITY DEFINER functions executable by anon/auth
- Audit `pg_proc` for SECURITY DEFINER functions in `public`.
- For each: either `REVOKE EXECUTE ... FROM anon, authenticated` (keep service-role only), convert to SECURITY INVOKER, or confirm intentional and document.

### 3.2 Extension in public schema
- Move offending extension(s) (likely `pg_net` / `pg_trgm`) to a dedicated `extensions` schema where safe. Skip if any is required-in-public by Supabase.

### 3.3 Public bucket allows listing
- Tighten the broad SELECT policy on `storage.objects` for the public bucket so files are only fetchable by direct URL, not listable.

### 3.4 RLS enabled, no policy
- Identify the table(s) and either add an explicit policy or remove RLS if the table is intentionally service-role only.

### 3.5 Postgres patch upgrade
- Inform the user — requires a manual click in Supabase dashboard. Provide link.

## Priority 4 — Info / already addressed

### 4.1 Edge functions without JWT
- Already triaged. Add Zinc webhook signature validation (low priority follow-up, not in this pass).

## Execution order

1. Migration A: profile exposure fix + `profiles_public` view.
2. Code sweep for non-owner profile reads → switch to `profiles_public`.
3. Migration B: `pending_recipient_addresses` UPDATE policy hardening.
4. Migration C: `realtime.messages` RLS policies.
5. Migration D: SECURITY DEFINER revokes + extension move + storage listing tightening + RLS-no-policy fix.
6. Update `mem://` security memories and notify user about Postgres upgrade.

## Out of scope (this pass)
- Postgres engine upgrade (user-action only).
- Zinc webhook signature validation (separate task).

## Risk notes
- Step 1 may break any UI that currently reads `email`/`dob`/`shipping_address` on *other* users — per privacy memory none should, but I'll grep to confirm before shipping.
- Step 3 (realtime) requires verifying current topic naming conventions in client hooks; if topics aren't user-scoped today, I'll align them with the new policy.
