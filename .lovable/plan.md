

# Replace Mock Friend Dates with Real Connection Data

## Problem
`src/hooks/useConnectedFriendsSpecialDates.ts` uses hardcoded mock data (John Smith, Emma Wilson, Michael Davis) instead of querying real connections. The `useEnhancedConnections` hook already fetches `profile_dob` and `profile_important_dates` for each accepted connection — this data just needs to be used.

## Database Verification
- **Curt Davidson** (connected to justin@elyphant.com): `dob: "03-01"` — birthday is March 1st
- **Charles Meeks**: `dob: "11-26"`
- **Justin Meeks**: `dob: "01-11"`

All data is already available via `useEnhancedConnections`.

## Changes

### `src/hooks/useConnectedFriendsSpecialDates.ts` — Full rewrite

1. **Remove** the `MOCK_FRIEND_DATES` array entirely (lines 9-37)
2. **Replace** the `useEffect` logic to iterate over real `connections` (already fetched by the hook) instead of mock data:
   - For each accepted connection with a `profile_dob` (MM-DD format), parse the month/day, compute the next occurrence (this year or next), and create a `GiftOccasion` with type `"birthday"`
   - For each connection's `profile_important_dates` array, do the same for anniversaries and other date types
   - Respect `data_sharing_settings.dob` privacy (only show if set to `"friends"` or `"public"`)
3. **Keep** the 90-day window filter and date sorting logic
4. **Populate** `personId`, `personName`, `personImage` from the connection's profile fields (`display_user_id`, `profile_name`, `profile_image`)

This single file change will make the hero countdown show "Curt Davidson's Birthday Countdown" with the real March 1st date instead of mock "John Smith" data.

