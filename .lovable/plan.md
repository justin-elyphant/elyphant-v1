


## Privacy Unification & Pre-Beta Security Hardening — COMPLETE

### Completed Steps

#### Steps 1-3 (Privacy Unification)
- ✅ Consolidated privacy to `privacy_settings` table as single source of truth
- ✅ Removed dead settings (`gift_surprise_mode`, `block_list_visibility`, `show_following_count`)
- ✅ Calibrated all 10 enforced privacy controls

#### Step 4-6 (Data Sharing Cleanup) — COMPLETE
- ✅ Removed `dataSharingSchema` and `data_sharing_settings` field from `profileSchema.ts`
- ✅ Dropped legacy `complete_onboarding` overload with `p_data_sharing_settings` param

#### Phase 1: Critical Security Fixes — COMPLETE
- ✅ Locked down 6 token/log/analytics tables to service_role only
- ✅ Fixed `is_group_admin`/`is_group_member` parameter shadowing (privilege escalation)
- ✅ Removed anonymous access from `refund_requests` and `conversation_threads`
- ✅ Scoped `pending_gift_invitations`, `wishlist_item_purchases`, `return_events` to proper owners
- ✅ Dropped open PII-exposing policies on `user_connections`

#### Phase 2: RLS Consolidation + Function Hardening — COMPLETE
- ✅ Consolidated `privacy_settings` from 6 overlapping policies to 3 clean ones
- ✅ Fixed `search_path` on `increment_group_gift_amount`, `decay_product_freshness`, `track_wishlist_purchase_and_notify`

#### Phase 3: Extended Security Sweep — COMPLETE
- ✅ `location_cache`: Replaced public ALL with service_role ALL + authenticated SELECT
- ✅ `pricing_settings`: Removed authenticated read; now admin-only
- ✅ Search path hardening: Fixed ALL 95 SECURITY DEFINER functions (`search_path=public` → `search_path=''`)
- ✅ Verified `profiles` has no `is_admin` column; admin managed via `business_admins` table (properly secured)

### Known Limitations
- Realtime channels: Supabase platform limitation — cannot add RLS to `realtime.messages`. Documented as known limitation.
- `storage.objects` RLS is disabled (Supabase-reserved schema — cannot fix via migrations). Must be re-enabled manually via Supabase SQL Editor: `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`
- Remaining linter warnings are pre-existing service_role `USING(true)` policies (intentional for backend-only tables), extensions in public schema, and 6 non-SECURITY-DEFINER functions without search_path (low risk).
