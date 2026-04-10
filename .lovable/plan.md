

## Plan: Pre-Beta Security Hardening -- Fix All Remaining Scan Findings

### What We're Fixing and Why

The security scan found **43 findings**: 3 critical errors, ~20 "always true" RLS warnings, 6 function search_path warnings, and several missing-protection warnings. This plan addresses them in priority order across two migrations.

---

### Migration 1: Critical Errors (3 fixes)

**1. Pending connection requesters can read full profiles (email, DOB, address)**
- The policy "Users can view connected profiles" grants SELECT on full profile rows for `pending` connections
- Fix: Restrict to `accepted` status only, or create a view/function that returns only non-sensitive fields for pending connections

**2. Guest orders publicly readable without session verification**
- "Guests can view recent orders by session" lets any unauthenticated user read all guest orders from the last 30 days
- Fix: Move guest order lookup to a server-side edge function that validates the checkout_session_id, or drop the public policy entirely

**3. Realtime orders broadcast to all subscribers**
- The `orders` table is published to Realtime with no channel-level scoping
- Fix: Remove `orders` from Realtime publication (the app already uses polling/refetch), or add Realtime authorization via RLS on `realtime.messages` (requires Supabase dashboard config since `realtime` is a reserved schema)

---

### Migration 2: Warnings (system tables, functions, misc)

**4. System tables writable by public role** -- Restrict to `service_role` or `authenticated`:
- `zma_security_events` (INSERT/UPDATE open to public)
- `zma_order_rate_limits` (INSERT/UPDATE open to public)
- `message_rate_limits` (INSERT/UPDATE open to public)
- `popularity_scores` (ALL operations open to public)
- `auto_gift_data_access` (INSERT open to public)

**5. Pending recipient address token validation too weak**
- UPDATE policy only checks `token IS NOT NULL` instead of matching a specific token value
- Fix: Require token match via a secure lookup or restrict to authenticated

**6. Email templates publicly readable**
- Fix: Restrict SELECT to `authenticated` or `service_role`

**7. Function search_path hardening** (6 functions)
- Set `search_path = ''` on the remaining unhardened functions
- Requires identifying which 6 functions are flagged (the scan doesn't name them -- we'll query the linter for specifics)

**8. "Always true" RLS policies** (~17 tables)
- These have `USING (true)` or `WITH CHECK (true)` on INSERT/UPDATE/DELETE
- Each needs review: some may be intentional (e.g., authenticated users can insert their own rows with a trigger check), others need proper ownership scoping

---

### What We Won't Touch
- **Extensions in public schema** (pg_trgm, uuid-ossp) -- moving these risks breaking dependent functions; this is a known Supabase default
- **Postgres version upgrade** -- requires Supabase dashboard action, not a migration
- **Realtime.messages RLS** -- reserved schema, must be configured via Supabase dashboard

---

### Execution Order
1. Migration 1: Fix the 3 critical errors (profiles, guest orders, realtime)
2. Migration 2: Harden system tables, fix token validation, email templates, functions
3. Migration 3: Audit and fix the ~17 "always true" policies (requires querying which tables are affected)
4. Update `useOrderRealtime.ts` if we remove orders from Realtime publication
5. Run a final security scan to confirm resolution

### Technical Details

The migrations will use `DROP POLICY IF EXISTS` + `CREATE POLICY` patterns. For the profiles fix, we'll likely split the connected-profiles policy into two: one for accepted connections (full non-sensitive fields) and one that blocks pending connections from seeing PII. The guest order fix will either drop the public policy or add a checkout_session_id matching requirement.

