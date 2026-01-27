

# Simplify Holiday Mode: Hide Date Picker

## Overview

Remove the manual date picker when "Holiday / Event" mode is selected. The holiday dropdown will handle the date automatically, and users can switch to "Specific Date" mode if they need a custom date.

---

## Current vs Proposed Layout

```text
CURRENT (Holiday Mode):                  PROPOSED (Holiday Mode):
┌────────────────────────────────┐       ┌────────────────────────────────┐
│ Holiday / Event  │ Specific    │       │ Holiday / Event  │ Specific    │
│   [SELECTED]     │   Date      │       │   [SELECTED]     │   Date      │
│                                │       │                                │
│ Popular Holidays/Events        │       │ Popular Holidays/Events        │
│ ┌────────────────────────────┐ │       │ ┌────────────────────────────┐ │
│ │ 🎂 John's Birthday (Mar 15)│ │       │ │ 🎂 John's Birthday (Mar 15)│ │
│ └────────────────────────────┘ │       │ └────────────────────────────┘ │
│                                │       │                                │
│ ┌──────────┐┌──────────┐┌────┐ │       │ Gift will arrive on or before  │
│ │ March    ││ 15      ▼││2026│ │       │ March 15, 2026                 │
│ └──────────┘└──────────┘└────┘ │       │                                │
│     [REDUNDANT - REMOVE]       │       │ Need a different date?         │
│                                │       │ Switch to "Specific Date" →    │
│ Gift will arrive on or before  │       └────────────────────────────────┘
│ March 15, 2026                 │       
└────────────────────────────────┘       
```

---

## Why This Works

| Scenario | Coverage |
|----------|----------|
| Standard holidays (Christmas, Valentine's, etc.) | ✅ Already in dropdown |
| Recipient's birthday | ✅ Auto-populated from profile |
| Custom important dates (Anniversary, Graduation) | ✅ Pulled from connection profile |
| Obscure/missing holiday | Switch to "Specific Date" mode |

**Estimated coverage: 95%+ of holiday use cases handled without manual date entry**

---

## Technical Changes

### File: `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx`

**Location**: Lines 546-620 (the `AnimatePresence` block)

**Change**: In the `deliveryType === 'holiday'` branch, remove the date picker entirely. Keep only:
1. `PresetHolidaySelector` dropdown
2. Date confirmation text (if a holiday is selected)
3. Optional helper text linking to "Specific Date" mode

### Before (current code):
```typescript
{deliveryType === 'holiday' ? (
  <motion.div ...>
    {/* Holiday dropdown */}
    <PresetHolidaySelector ... />
    
    {/* Date picker - REMOVE THIS */}
    <div className="bg-muted/30 rounded-lg py-3 px-2">
      {isMobile ? <Picker ... /> : <DropdownDatePicker ... />}
    </div>
  </motion.div>
) : ( ... )}
```

### After (simplified):
```typescript
{deliveryType === 'holiday' ? (
  <motion.div ...>
    {/* Holiday dropdown only */}
    <PresetHolidaySelector ... />
    
    {/* Helper text for edge cases */}
    {!selectedPreset && (
      <p className="text-xs text-muted-foreground text-center">
        Don't see your date? Switch to{' '}
        <button 
          type="button"
          onClick={() => setDeliveryType('specific')}
          className="text-primary underline underline-offset-2"
        >
          Specific Date
        </button>
      </p>
    )}
  </motion.div>
) : ( ... )}
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` | Remove date picker from holiday flow, add helper text |

---

## User Experience Benefits

1. **Cleaner UI**: 50% less visual noise in holiday mode
2. **Clear Mental Model**: Holiday = pick from list, Specific = manual entry
3. **Faster Task Completion**: One selection instead of two
4. **Escape Hatch**: "Don't see your date?" link for edge cases

