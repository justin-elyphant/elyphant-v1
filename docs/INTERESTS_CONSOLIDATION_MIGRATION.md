# Interests Consolidation Migration

## Overview
This document outlines the migration from dual storage (`interests` and `gift_preferences`) to a single source of truth (`interests`) for user preference data.

## Problem
Previously, the application maintained two separate fields for user interests:
- `interests` (string array): Used in settings UI and some AI logic
- `gift_preferences` (object array with `category` and `importance`): Used in other AI logic

This caused:
- Data inconsistency (one could be populated while the other was `null`)
- Confusion about which field to use
- Duplicate code for handling both formats
- Maintenance overhead

## Solution: Phase 1 & Phase 2 Implementation

### Phase 1: Data Migration & Backwards Compatibility

#### 1.1 Migration Edge Function
Created `migrate-interests-consolidation` edge function to:
- Query all profiles where `gift_preferences` exists but `interests` is null/empty
- Extract categories from `gift_preferences` → populate `interests`
- Log migration statistics

**To run migration:**
```bash
# Call the edge function (requires admin/service role)
curl -X POST https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/migrate-interests-consolidation \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

#### 1.2 Auto-Sync During Transition
Modified `useProfileUpdate.ts` to automatically sync `interests` → `gift_preferences`:
- When user updates `interests`, automatically create corresponding `gift_preferences`
- Maintains backwards compatibility for any code still reading `gift_preferences`
- Marked with `[TRANSITION]` logs for easy tracking

### Phase 2: Code Refactoring

#### 2.1 AI Services Updated
**Files modified:**
- `src/services/UnifiedGiftAutomationService.ts` (lines 303-320)
- `src/services/UnifiedGiftManagementService.ts` (lines 532-548)  
- `src/services/gifteeDataService.ts` (lines 83-91)

**Changes:**
- **Primary source**: Now reads from `interests` first
- **Fallback**: Falls back to `gift_preferences` if `interests` is empty (backwards compatibility)
- Added console logs to track which source is being used

#### 2.2 Type Definitions Updated
**File:** `src/types/profile.ts`

**Changes:**
- Added `@deprecated` JSDoc comments to `gift_preferences` fields
- Stopped mapping `interests` → `gift_preferences` in `profileFormToApiData()`
- Auto-sync now handled by `useProfileUpdate.ts` instead

#### 2.3 Settings UI
**Current state:** Already uses `interests` field exclusively ✅
- `InterestsSettings.tsx` reads/writes to `interests`
- Auto-save uses `updateProfile({ interests: [...] })`

## Data Flow

### Current Flow (Phase 1 & 2 Active)
```
User edits interests in UI
  ↓
useGeneralSettingsForm → updateProfile({ interests: ["Dallas Cowboys", "Lululemon"] })
  ↓
useProfileUpdate.ts → Auto-sync interests to gift_preferences
  ↓
Database: Both fields updated
  - interests: ["Dallas Cowboys", "Lululemon"]
  - gift_preferences: [{ category: "Dallas Cowboys", importance: "medium" }, ...]
  ↓
AI Services → Read interests first (fallback to gift_preferences if empty)
```

## Testing Checklist

### ✅ Completed
- [x] Migration edge function created
- [x] Auto-sync implemented in `useProfileUpdate.ts`
- [x] AI services refactored to use `interests` as primary
- [x] Type definitions marked as deprecated
- [x] Form mapping no longer creates `gift_preferences`

### 🔄 To Test
- [ ] New user: Add interests → verify both fields populated
- [ ] Existing user with `gift_preferences`: Verify migration copies to `interests`
- [ ] AI gift search: Verify uses `interests` (check console logs)
- [ ] Public profile: Verify "Based on My Interests" displays correctly
- [ ] Settings page: Add/remove interests → verify auto-save works

## Future Phases (3-6 months)

### Phase 3: UI Updates (Optional)
- Update privacy settings: "Gift Preferences" → "Interests"
- Update connection permissions labels
- Ensure all tooltips/help text references "interests"

### Phase 4: Testing & Validation
- Comprehensive testing across all features
- Monitor logs for fallback usage
- Verify no new code uses `gift_preferences`

### Phase 5: Complete Deprecation (6 months after Phase 2)
Once confident all users have migrated:
1. Remove `gift_preferences` from AI service fallbacks
2. Remove backwards compatibility sync from `useProfileUpdate.ts`
3. Drop `gift_preferences` column from database (migration)
4. Remove deprecated type definitions
5. Update privacy settings to remove `gift_preferences` option

## Migration Timeline
- **Phase 1 & 2**: ✅ Completed
- **Phase 3**: Optional UI polish (1-2 weeks)
- **Phase 4**: Testing period (1 month)
- **Phase 5**: Final cleanup (3-6 months after Phase 2)

## Rollback Plan
If issues arise:
1. Keep both fields in database (no data loss)
2. Revert AI services to use `gift_preferences` as primary
3. Continue auto-sync from `gift_preferences` → `interests`
4. Re-run migration with fixes

## Support
For questions or issues:
- Check console logs for `[TRANSITION]` markers
- Verify database has both fields populated
- Review `useProfileUpdate.ts` for sync logic
