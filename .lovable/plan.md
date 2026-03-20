

## Consolidate Suggestion Engine — Single Server-Side RPC

### Problem

Two separate suggestion systems exist:
1. **`useConnectionSuggestions` hook** — client-side N+1 monster: fetches ALL non-connected profiles, then fires an RPC per profile for mutual count. Slow, wasteful, no dismiss persistence, no pending-request filtering.
2. **`get_suggested_connections` RPC** — efficient friends-of-friends query, but only used in the search pre-state. Misses interest matching and cold-start users (0 connections = 0 results).

Additionally, `useMutualConnections.ts` is dead code (zero imports outside itself).

### Plan

**1. Upgrade `get_suggested_connections` RPC to handle everything**

Extend the existing RPC to cover all scoring signals in one query:
- Keep the friends-of-friends mutual count logic (already there)
- Add interest overlap: accept `user_interests text[]` param, compute `array_length(array_intersect(p.interests, user_interests))` as `common_interests`
- Add cold-start fallback: when the user has 0 accepted connections, fall back to profiles with the most connections (popular users) + interest overlap
- Exclude pending connections (any row in `user_connections` regardless of status, not just accepted)
- Add `profile_image` completeness flag for tie-breaking
- Increase default limit from 6 → 15 (tab shows more than search pre-state)
- Return `common_interests` count alongside `mutual_count`

**2. Rewrite `useConnectionSuggestions` to use the RPC**

Replace the entire 130-line hook with ~30 lines:
- Fetch current user's interests from profiles
- Call `get_suggested_connections` RPC with `requesting_user_id` and `user_interests`
- Map results directly to `Connection[]` — no client-side scoring loop, no N+1
- Generate `reason` string from `mutual_count` / `common_interests` returned by RPC

**3. Delete `useMutualConnections.ts`**

Dead code — nothing imports it. The `get_mutual_friends_count` RPC is called directly where needed.

**4. Update `SuggestionCard` dismiss to persist**

Store dismissed suggestion IDs in localStorage (`dismissed_suggestions`) so they survive page reloads. Filter them out in `useConnectionSuggestions` before setting state. No new DB table needed — lightweight and sufficient.

### Files affected
- **Migrate**: Update `get_suggested_connections` RPC (add interests param, cold-start, pending exclusion)
- **Rewrite**: `src/hooks/useConnectionSuggestions.ts` — slim down to RPC caller
- **Delete**: `src/hooks/useMutualConnections.ts` — unused
- **Edit**: `src/components/connections/SuggestionCard.tsx` — persist dismiss to localStorage
- **Edit**: `src/integrations/supabase/types.ts` — auto-updated by migration

### What stays unchanged
- `get_mutual_friends_count` RPC (still used by search results enrichment)
- `EnhancedConnectionSearch.tsx` (uses `get_suggested_connections` independently for the search pre-state with limit 6)
- `useConnectionsAdapter.tsx` — still consumes `useConnectionSuggestions`, no interface change
- `SuggestionsTabContent.tsx` — no changes needed
- All connection request / accept / reject logic

