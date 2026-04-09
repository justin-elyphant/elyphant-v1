

## Finish Privacy Unification: Steps 4-6

### Step 4 -- Remove all active `data_sharing_settings` reads/writes

Files with active code (not just comments) to clean up:

| File | What to do |
|------|-----------|
| `useConsistentProfile.ts` | Remove `data_sharing_settings` from the returned object |
| `useProfileFetch.ts` | Stop reading `profile.data_sharing_settings`, remove from mapped output |
| `CompactProfileHeader.tsx` | Remove `data_sharing_settings` fallback (already reads `privacy_settings`) |
| `dataFormatUtils.ts` | Remove `dataSharingSettings` construction and `data_sharing_settings` from return |
| `useProfileForm.tsx` | Remove static `dataSharingSettings` object from form loading |
| `hooks/settings/useProfileData.ts` | Remove `data_sharing_settings` from `initialFormData` |
| `profile-setup/hooks/useProfileData.ts` | Remove `data_sharing_settings` from `profileData` state and mapping |
| `sharedValidation.ts` | Remove case 4 data_sharing validation (privacy handled by its own hook) |
| `DataFlowTester.tsx` | Remove test 3 checking data_sharing_settings |
| `onboardingSettingsSync.ts` | Remove `hasDataSharingSettings` check |
| `dataCompatibilityTest.ts` | Remove `hasDataSharingSettings` field |

### Step 5 -- Delete `DataSharingSettings` type

- Delete from `types/profile.ts` (the interface + export)
- Delete from `hooks/settings/types.ts` (the interface + remove from `ProfileFormData`)
- Delete from `types/supabase.ts` (the deprecated type alias)
- Remove all imports of `DataSharingSettings` across ~13 files
- Remove `data_sharing_settings` field from `ProfileFormData`, `ProfileData`, `Profile`, `ExtendedProfile` interfaces

### Step 6 -- Database column deprecation

- Migration to drop `data_sharing_settings` column from `profiles` table
- Update `complete_onboarding` RPC to remove the `p_data_sharing_settings` parameter
- Clean up `profileFormToApiData()` and `profileDataMapper.ts` to stop producing `data_sharing_settings` in API payloads

### Risk
Low-medium. The privacy_settings table is already the enforced source of truth. These are all dead code paths writing/reading values that nothing consumes. The RPC change needs care to match all callers.

### Estimated scope
~15 files edited, 1 DB migration, 1 RPC update.

