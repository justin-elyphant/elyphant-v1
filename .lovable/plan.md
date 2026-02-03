
# Fix: Auto-Approve Toggle Not Syncing with User Settings

## Problem

The "Auto-approve gifts" toggle in the Recurring Gift wizard always shows as **OFF** (unchecked) even when the user has previously enabled it. The toggle is not disabled - it can be toggled - but it doesn't reflect the user's saved preference.

## Root Cause

In `src/components/gifting/auto-gift/AutoGiftSetupFlow.tsx` (line 120):

```typescript
const [formData, setFormData] = useLocalStorage('autoGiftDraft', {
  // ...other fields...
  autoApprove: false,  // ❌ Hardcoded to false
  // ...
});
```

The `autoApprove` field is hardcoded to `false` instead of reading from `settings?.auto_approve_gifts`. Since `useLocalStorage` persists this value, subsequent opens of the wizard will read the stored `false` value.

**Key insight**: The `settings` object (from `useAutoGifting` hook) contains `auto_approve_gifts`, but this is never used to initialize the form state.

---

## Solution

Initialize the `autoApprove` form field from the user's global settings, similar to how `budgetLimit` already uses `settings?.default_budget_limit`.

### Technical Changes

**File: `src/components/gifting/auto-gift/AutoGiftSetupFlow.tsx`**

**Change 1: Update form initialization (line 120)**

| Before | After |
|--------|-------|
| `autoApprove: false` | `autoApprove: settings?.auto_approve_gifts ?? false` |

**Change 2: Add effect to sync when settings load (new effect after line 136)**

Since `settings` loads asynchronously (after the component mounts), we need an effect to update the form when settings become available:

```typescript
// Sync autoApprove with settings when settings load
useEffect(() => {
  if (settings && !initialData) {
    // Only update if this is a new rule (not editing existing)
    setFormData(prev => ({
      ...prev,
      autoApprove: settings.auto_approve_gifts ?? prev.autoApprove
    }));
  }
}, [settings?.auto_approve_gifts]);
```

This ensures:
- New rules inherit the user's global auto-approve preference
- Editing existing rules still respects the initialData (though auto-approve is global, not per-rule)

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/gifting/auto-gift/AutoGiftSetupFlow.tsx` | Initialize `autoApprove` from settings; add sync effect |

---

## Testing

After implementation:

1. **Navigate to `/recurring-gifts`**
2. **Click "Set Up Recurring Gift"**
3. **Go to Step 3 (Notifications & Approval)**
4. **Verify the "Auto-approve gifts" toggle reflects the user's saved preference**
5. **Toggle it and save - verify it persists on next open**

Expected behavior for Charles (current user):
- If Charles has `auto_approve_gifts: false` in settings, toggle should be OFF
- If Charles has `auto_approve_gifts: true` in settings, toggle should be ON
- Toggling and saving should update the global setting
