

## Privacy Policy Calibration — Completed

### Changes Made

**Step 1 — Removed 3 dead settings**
- Deleted `gift_surprise_mode`, `block_list_visibility`, `show_following_count` from `PrivacySettings` interface, `DEFAULT_SETTINGS`, and `normalizeSettings()` in `usePrivacySettings.ts`
- Removed "Gift surprise mode" toggle from Settings UI (`PrivacySharingSettings.tsx`)
- Removed unused `Lock` icon import

**Step 2 — Enforced `show_follower_count`**
- `publicProfileService.ts` now fetches `show_follower_count` and conditionally omits `connection_count` from response
- `ProfileBanner.tsx` accepts `showConnectionCount` prop and conditionally hides the count
- `CompactProfileHeader.tsx` (user-profile version) accepts `showConnectionCount` and gates both desktop and mobile stats
- `InstagramProfileLayout.tsx` passes `showConnectionCount` through to `CompactProfileHeader`
- Owner always sees their own count; visitors only see it if enabled

**Step 3 — Enforced `interests_visibility`**
- `ProfileInfo.tsx` now accepts `viewerRelationship` prop and checks visibility against it
- Interests are shown only when: viewer is self, visibility is public, or visibility is friends AND viewer is a friend
- Replaces the previous weak check (`!== 'private'`) with proper relationship-aware gating

**Step 4 — DB migration**
- Dropped `gift_surprise_mode`, `block_list_visibility`, `show_following_count` columns from `privacy_settings` table
- Updated `create_default_privacy_settings` trigger to stop setting dropped columns

### Result
- 13 privacy settings → 10, all properly enforced
- No dead settings remain
- `show_follower_count` and `interests_visibility` now work as advertised
