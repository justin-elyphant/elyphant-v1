

## Two issues

### 1. CTA copy wrong
- `ConnectionsHeroSection.tsx` says "Invite a Friend, Get $100" and "earn $100 for every friend who joins"
- Per beta program: only the **inviter** gets credit (no doubling). The new user does NOT get $100 for inviting — they GIVE $100 to a friend who joins.
- Account dropdown menu also says "Invite Friends, Get $100" (per screenshot) — needs same fix.

**Fix:** Change copy to "Give a Friend $100" / "Share your link and give a friend $100 to join."

Need to find all instances — search for "Get $100" string.

### 2. Larry missing from `/trunkline/referrals` Per-Tester Activity
Screenshot shows only Heather Meeks and Justin Meeks. Larry David should appear since he was just backfilled with a `credit_issued` referral and a $100 welcome credit.

Need to inspect `get_beta_tester_analytics` RPC to understand the inclusion criteria — likely it filters on something Larry doesn't yet satisfy (e.g., presence in a `beta_testers` table, or a credit `type` filter that excludes `welcome`, or joins on `beta_referrals.referrer_id` only).

## Plan

**Step 1 — Investigate (in build mode):**
- Read `get_beta_tester_analytics` SQL definition
- Check why Larry's row is excluded
- Check Larry's records: `beta_credits`, `beta_referrals`, any `beta_testers` registry table

**Step 2 — Fix CTA copy** (reuse existing `ConnectionsHeroSection.tsx` + account dropdown component, no new components):
- "Invite a Friend, Get $100" → "Give a Friend $100"
- "earn $100 for every friend who joins" → "give a friend $100 when they join"
- Same change in account dropdown menu item

**Step 3 — Fix Per-Tester Activity inclusion**
- Adjust `get_beta_tester_analytics` so anyone with a `beta_credits` row OR a `beta_referrals` row (as referrer or referred) appears. Larry has both — so likely the RPC filters on a stale criterion (e.g., only `type='issued'` or only users present pre-launch). Will inspect and patch via migration.

**Files touched:**
1. `src/components/connections/ConnectionsHeroSection.tsx` — copy update
2. Account dropdown component (TBD — find via search for "Get $100")
3. New migration — patch `get_beta_tester_analytics` if needed

**No new components, no new tables, no new credit types.**

