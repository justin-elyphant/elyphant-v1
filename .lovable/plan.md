

## Plan: Scale-Ready Security Fixes (4 Findings)

These fixes address the remaining vulnerabilities that become exploitable as you grow past beta.

---

### What's Wrong and Why It Matters

1. **Profile PII over-exposure** (CRITICAL) — The "Public wishlist owners are discoverable" policy returns the *entire* profile row (email, shipping address, DOB) to anyone, including anonymous users. At scale, a scraper could harvest every public-wishlist user's PII in minutes.

2. **approve-auto-gift has no auth** (HIGH) — `verify_jwt=false` and the function trusts `userId` from the request body. Anyone can call this endpoint with someone else's user ID and approve/reject their auto-gifts.

3. **Edge function input validation** (MEDIUM) — `process-order-v2`, `nicole-unified-agent`, and `get-products` lack schema validation. Lower risk since they're internal/public, but formal validation prevents abuse at scale.

4. **user_type privilege escalation scanner finding** (ALREADY FIXED) — The trigger we added handles this, but the scanner finding needs to be marked as resolved.

---

### Implementation Steps

#### Step 1: Restrict Profile PII at the Database Level
Create a migration that:
- Drops the current "Public wishlist owners are discoverable" policy
- Replaces it with a policy that uses a **column-restricting view** or rewrites the policy to only match on discovery queries
- Creates a `public.profiles_public_view` view exposing ONLY: `id`, `name`, `avatar_url`, `username` (no email, DOB, shipping_address)
- Updates the "Users can view connected profiles" policy to gate sensitive columns through `can_view_profile()` enhanced with `privacy_settings` checks

Since RLS operates at row level (not column level), the cleanest approach is:
- Keep the row-level policy as-is for connected users
- For the public wishlist policy, create a **secure view** (`profiles_discoverable`) that only exposes safe columns, and point the wishlist-browsing UI queries at that view instead of the `profiles` table directly

#### Step 2: Secure approve-auto-gift
- Set `verify_jwt = true` in `config.toml`
- Rewrite the function to extract `userId` from the JWT (`Authorization` header → `supabase.auth.getUser()`) instead of trusting the request body
- Keep the token-based flow (email links) working by checking: if a valid `token` is provided, use the `user_id` from the token record; otherwise require JWT auth

#### Step 3: Add Input Validation to Remaining Edge Functions
- Add lightweight Zod schemas to `get-products` (validate `query`, `limit`, `offset` types)
- Add Zod schema to `nicole-unified-agent` (validate `message` string, `sessionId`)
- `process-order-v2` is internal-only (called by webhooks/cron) — add basic type checks

#### Step 4: Update Security Scanner Findings
- Mark `get_user_context_privilege_escalation` as fixed (trigger already deployed)
- Update `profiles_public_email_shipping` after the view migration
- Update `edge_func_validation_v2` after adding Zod schemas

---

### Files Changed

| File | Change |
|------|--------|
| New migration SQL | Create `profiles_discoverable` view, update public wishlist policy |
| `supabase/config.toml` | `approve-auto-gift` → `verify_jwt = true` |
| `supabase/functions/approve-auto-gift/index.ts` | Extract userId from JWT, keep token fallback |
| `supabase/functions/get-products/index.ts` | Add Zod input validation |
| `supabase/functions/nicole-unified-agent/index.ts` | Add Zod input validation |
| Frontend queries referencing public profiles | Point at `profiles_discoverable` view for wishlist browsing |

---

### Technical Detail: The Secure View Approach

```text
profiles table (full PII — gated by RLS)
  ├── Own row: full access (auth.uid() = id)
  ├── Connected users: full row via can_view_profile()
  │   └── UI still masks email/address per privacy_settings
  └── Public wishlist: BLOCKED (policy removed)

profiles_discoverable view (safe columns only)
  ├── id, name, avatar_url, username
  ├── RLS: anyone can SELECT if user has a public wishlist
  └── No email, DOB, shipping_address, interests, etc.
```

Frontend wishlist-browsing queries switch from `supabase.from('profiles')` to `supabase.from('profiles_discoverable')` for public contexts.

