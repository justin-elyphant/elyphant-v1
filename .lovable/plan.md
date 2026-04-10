

## Plan: Pre-Beta Security Hardening — COMPLETED

### What Was Done

#### Migration 1: Critical Errors (3 fixes) ✅
1. **Profiles**: Restricted "Users can view connected profiles" to `accepted` connections only (was `pending` + `accepted`). Merged two duplicate wishlist-owner policies into one.
2. **Guest Orders**: Dropped "Guests can view recent orders by session" policy entirely.
3. **Realtime**: Removed `orders` table from Realtime publication. Updated `useOrderRealtime.ts` to a no-op stub.

#### Migration 2: System Table Hardening ✅
- Moved 16 system tables from `public` INSERT/UPDATE to `service_role` only
- Fixed `vendor_accounts` policy from `public` to `service_role`
- Fixed `pending_recipient_addresses` token validation to require authentication
- Restricted email templates to authenticated users
- Hardened `search_path` on 6 remaining functions (+ both overloads of `get_upcoming_auto_gift_events`)

#### Migration 3: Remaining Quick Fixes ✅
- `zma_funding_alerts`: authenticated INSERT → service_role
- `email_analytics`: business admin policy from public → authenticated role
- `get_high_converting_products`: search_path hardened

#### Migration 4: Privilege Escalation Protection ✅
- BEFORE UPDATE trigger on `profiles` table prevents self-modification of `user_type`, `signup_source`, `signup_metadata`, `source_attribution`

#### Migration 5: Scale-Ready Security Fixes ✅
- Dropped "Public wishlist owners are discoverable" policy (leaked full profile PII to anonymous users)
- Created `profiles_discoverable` secure view (exposes only `id`, `name`, `username`, `profile_image`)
- Set view to `security_invoker = on` to respect querying user's permissions

#### Edge Function Hardening ✅
- `approve-auto-gift`: Changed from `verify_jwt=false` to `verify_jwt=true`
- `approve-auto-gift`: Extracts userId from JWT via `getClaims()` instead of trusting request body
- `approve-auto-gift`: Added ownership check (JWT user must own the execution)
- `approve-auto-gift`: Token-based flow (email links) preserved as fallback
- `get-products`: Added input validation (query string/length, page/limit bounds)
- `nicole-unified-agent`: Added input validation (message string/length, sessionId type)
- `process-order-v2`: Added input validation (orderId type/length)

### Linter Status: 4 remaining (all non-actionable)
- 1 INFO: Table with RLS enabled but no policies (intentional)
- 2 WARN: Extensions in public schema (Supabase default)
- 1 WARN: Postgres version (dashboard upgrade)

### Remaining Advisory Items (Future Work)
- **Realtime channels**: `messages`, `contributions`, `funding_campaigns` still in Realtime publication — needs Supabase Dashboard Realtime authorization config
- **Profile PII via connections**: `can_view_profile()` grants full row access to accepted connections — privacy_settings enforcement should be added inside the function
- **zinc-webhook**: Should validate webhook signatures using Zinc's webhook secret
- **Rate limiting**: Public endpoints (get-products, get-shipping-quote, nicole-unified-agent) should have rate limiting at scale
