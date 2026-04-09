

## Privacy System Cleanup: Duplicates and Unnecessary Enforcement

### Issues Found

**1. `DataSharingStep` and `PrivacyStep` are identical components**
Both files are character-for-character the same UI (Birthday + Interests selects using `usePrivacySettings`). Only the subtitle text differs slightly. One should be deleted and the other reused.

**2. Three duplicate type aliases for the same concept**
- `FieldVisibility` in `usePrivacySettings.ts` = `'private' | 'friends' | 'public'`
- `PrivacyLevel` in `utils/privacyUtils.ts` = `'private' | 'friends' | 'public'`
- `PrivacyLevel` in `gifting/events/types.ts` = `'private' | 'shared' | 'public'` (different values -- "shared" vs "friends")

The first two are identical. They should be consolidated into one canonical type exported from `usePrivacySettings.ts`.

**3. `PrivacyNotice` and `PrivacyIndicator` overlap significantly**
Both render privacy-level badges/alerts with the same icon logic (Eye/EyeOff/Users) and the same color mapping (public=warning, friends=info, private=success). `PrivacyIndicator` is the more capable version (reads from the unified table, supports labels). `PrivacyNotice` is a simpler Alert wrapper used in only 1 file (`ProfileInfo.tsx`). They should merge into one component.

**4. `shouldDisplayBirthday` in `birthdayUtils.ts` duplicates enforcement logic**
This function takes `dataSharingSettings.dob` and does visibility gating. But `BirthdayCountdown.tsx` and `useConnectionsAdapter.ts` already query `privacy_settings.dob_visibility` directly and do the same check inline. There are now two parallel birthday-visibility enforcement paths. Should consolidate into one utility that takes the `dob_visibility` value directly.

**5. `privacyUtils.ts` is mostly dead code**
- `getDefaultDataSharingSettings()` -- deprecated, only used for legacy form compat
- `normalizeDataSharingSettings()` -- deprecated, used in 2 files
- `PrivacyLevel` type -- duplicate of `FieldVisibility`
- `getReadablePrivacyLevel()` / `getSharingLevelLabel()` -- useful but should move to the unified hook or a slim helper

**6. Legacy `data_sharing_settings` still written in 3 onboarding paths**
`UnifiedOnboarding.tsx`, `StreamlinedSignUp.tsx`, and `useProfileSubmission.ts` still write static defaults to the JSONB column. These writes are unnecessary since privacy now lives in `privacy_settings` table.

### Proposed Cleanup

**Step 1 -- Delete `DataSharingStep`, keep `PrivacyStep` as the single onboarding privacy component**
Update any imports referencing `DataSharingStep` to use `PrivacyStep`.

**Step 2 -- Merge `PrivacyNotice` into `PrivacyIndicator`**
Add a `mode="inline"` or `variant="alert"` prop to `PrivacyIndicator` for the Alert-style rendering. Delete `PrivacyNotice.tsx`. Update `ProfileInfo.tsx`.

**Step 3 -- Consolidate types: kill `PrivacyLevel`, use `FieldVisibility` everywhere**
- Delete `PrivacyLevel` export from `privacyUtils.ts`
- Update `types/supabase.ts`, `ProfileInfo.tsx`, `PrivacyNotice` consumers to import `FieldVisibility` from `usePrivacySettings`
- Leave the gifting events `PrivacyLevel` alone (it uses "shared" which is a different concept)

**Step 4 -- Refactor `shouldDisplayBirthday` to accept a visibility string**
Change signature from `(dataSharingSettings, viewerRelationship)` to `(visibility: FieldVisibility, viewerRelationship)`. Update callers. This becomes the single birthday-visibility check.

**Step 5 -- Delete `privacyUtils.ts` entirely**
- Move `getReadablePrivacyLevel()` to `usePrivacySettings.ts` as a standalone export
- Remove all imports of the dead file

**Step 6 -- Stop writing `data_sharing_settings` in onboarding**
Remove the JSONB writes from `UnifiedOnboarding.tsx`, `StreamlinedSignUp.tsx`, and `useProfileSubmission.ts`.

### Impact Summary

| What | Before | After |
|------|--------|-------|
| Duplicate components | 2 (DataSharingStep + PrivacyStep) | 1 |
| Privacy display components | 2 (PrivacyNotice + PrivacyIndicator) | 1 |
| Type aliases for same concept | 3 | 1 (`FieldVisibility`) |
| Birthday visibility check paths | 3 | 1 |
| Dead utility files | 1 (`privacyUtils.ts`) | 0 |
| Legacy JSONB write points | 3 | 0 |

### Risk
Low. All changes are mechanical consolidations. No schema changes needed.

