

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

### Linter Status: 4 remaining (all non-actionable)
- 1 INFO: Table with RLS enabled but no policies (intentional)
- 2 WARN: Extensions in public schema (Supabase default)
- 1 WARN: Postgres version (dashboard upgrade)

### Remaining Advisory Items (Future Work)
- **Realtime channels**: `messages`, `contributions`, `funding_campaigns` still in Realtime publication — needs Supabase Dashboard Realtime authorization config
- **Profile PII via connections**: `can_view_profile()` grants full row access to accepted connections — privacy_settings enforcement should be added inside the function
- **approve-auto-gift**: Edge function has `verify_jwt=false` — should validate JWT in code or set to true
- **user_type escalation**: `user_type` stored in mutable profiles table — should be in a separate role table
