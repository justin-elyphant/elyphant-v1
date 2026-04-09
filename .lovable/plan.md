

## Unify Privacy: Merge `data_sharing_settings` into `privacy_settings`

### Current State (Two Systems)

| System | Storage | Fields | Used In |
|--------|---------|--------|---------|
| `privacy_settings` table | Dedicated columns per user | `profile_visibility`, `allow_connection_requests_from`, `allow_message_requests`, `wishlist_visibility`, `auto_gift_consent`, `gift_surprise_mode`, `block_list_visibility`, `show_follower_count`, `show_following_count` | 7 files |
| `data_sharing_settings` JSONB | Column on `profiles` table | `dob`, `shipping_address`, `interests`, `gift_preferences` (deprecated), `email` | ~50 files |

### Target State (One System)

Add 4 new columns to `privacy_settings` table, retire `data_sharing_settings` JSONB from profiles.

```text
privacy_settings table (unified)
├── Social Controls (existing)
│   ├── profile_visibility
│   ├── allow_connection_requests_from
│   ├── allow_message_requests
│   ├── wishlist_visibility
│   ├── auto_gift_consent
│   ├── gift_surprise_mode
│   ├── block_list_visibility
│   ├── show_follower_count
│   └── show_following_count
└── Field Visibility (NEW - migrated from data_sharing_settings)
    ├── dob_visibility          (default: 'friends')
    ├── shipping_address_visibility (default: 'private')
    ├── interests_visibility    (default: 'public')
    └── email_visibility        (default: 'friends')
```

`gift_preferences` is dropped entirely (deprecated, always mirrored `interests`).

### Implementation Steps

**Step 1 — Database migration**
- Add 4 columns (`dob_visibility`, `shipping_address_visibility`, `interests_visibility`, `email_visibility`) to `privacy_settings` with defaults
- Create a one-time migration function that copies existing `data_sharing_settings` values from `profiles` into the new columns
- Do NOT drop `profiles.data_sharing_settings` yet (backward compat during transition)

**Step 2 — Update `usePrivacySettings` hook** (1 file)
- Add the 4 new fields to `PrivacySettings` interface
- Read/write them alongside existing columns
- Export a single unified hook that replaces both privacy sources

**Step 3 — Update `DataSharingSection` component** (1 file)
- Read from `usePrivacySettings` instead of form context `data_sharing_settings`
- Write to `privacy_settings` table via `updateSettings()`

**Step 4 — Update consumers (~15 key files)**
- `useProfileData.ts`, `useProfileSave.ts`, `useProfileForm.tsx` — stop reading/writing `data_sharing_settings`
- `publicProfileService.ts`, `privacyAwareFriendSearch.ts` — read from `privacy_settings` table
- `birthdayUtils.ts`, `UnifiedGiftManagementService.ts` — use `privacy_settings` for visibility checks
- Onboarding steps (`DataSharingStep`, `PrivacyStep`) — wire to `usePrivacySettings`
- `dataExportUtils.ts` — export from `privacy_settings`
- Profile fetch contexts — stop mapping `data_sharing_settings`

**Step 5 — Clean up types** (3-4 files)
- Remove `DataSharingSettings` type from `src/hooks/settings/types.ts`, `src/types/supabase.ts`, `src/utils/privacyUtils.ts`
- Consolidate into the `PrivacySettings` interface in `usePrivacySettings.ts`
- Remove `gift_preferences` references everywhere

**Step 6 — Mark `profiles.data_sharing_settings` as deprecated**
- Leave the column in the DB but stop writing to it
- Can be dropped in a future cleanup migration

### What This Fixes
- Single source of truth for all privacy — one table, one hook, one settings page
- Eliminates the `gift_preferences` deprecated field
- Reduces privacy-related code from ~50 files to ~7 files touching the hook
- Settings UI reads/writes one place instead of two

### Risk
- Low: no schema breaking changes, backward-compatible migration
- The `profiles.data_sharing_settings` column stays but becomes read-only during transition
- All 50 consumer files need updating but each change is mechanical (swap data source)

