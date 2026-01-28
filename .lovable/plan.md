
# Fix: Hide Arrival Date Preview Until Holiday Selected

## The Problem

In "Holiday / Event" mode, the arrival date preview ("Gift will arrive on or before February 4th, 2026") appears even when **no holiday is selected**. This happens because:

1. `effectiveDate` falls back to the date picker's default value (7 days from now)
2. The preview always renders when `effectiveDate` exists

This is confusing because the date is meaningless until a holiday is actually chosen.

---

## Current vs Proposed Behavior

```text
CURRENT (No holiday selected):           PROPOSED (No holiday selected):
┌────────────────────────────────┐       ┌────────────────────────────────┐
│ Popular Holidays/Events        │       │ Popular Holidays/Events        │
│ ┌────────────────────────────┐ │       │ ┌────────────────────────────┐ │
│ │ Select a holiday...        │ │       │ │ Select a holiday...        │ │
│ └────────────────────────────┘ │       │ └────────────────────────────┘ │
│                                │       │                                │
│ Don't see your date?           │       │ Don't see your date?           │
│                                │       │                                │
│ Gift will arrive on or before  │       │     [NO DATE SHOWN YET]        │
│ February 4th, 2026 ← CONFUSING │       │                                │
└────────────────────────────────┘       └────────────────────────────────┘

AFTER holiday selected:                  AFTER holiday selected:
┌────────────────────────────────┐       ┌────────────────────────────────┐
│ 🎂 John's Birthday (Mar 15)    │       │ 🎂 John's Birthday (Mar 15)    │
│                                │       │                                │
│ Gift will arrive on or before  │       │ Gift will arrive on or before  │
│ March 15, 2026 ← NOW USEFUL    │       │ March 15, 2026 ✓               │
└────────────────────────────────┘       └────────────────────────────────┘
```

---

## Technical Solution

**File**: `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx`

**Location**: Lines 630-635 (the date preview section)

**Change**: Conditionally show the arrival date based on delivery type:
- **Holiday mode**: Only show when `selectedPreset` exists (a holiday was picked)
- **Specific mode**: Always show (user is manually choosing the date)

### Current Code:
```typescript
{/* Selected Date Preview */}
{effectiveDate && (
  <p className="text-xs text-muted-foreground text-center">
    Gift will arrive on or before <span className="font-medium text-foreground">{format(effectiveDate, 'PPP')}</span>
  </p>
)}
```

### Updated Code:
```typescript
{/* Selected Date Preview - only show when date is meaningful */}
{effectiveDate && (deliveryType === 'specific' || selectedPreset) && (
  <p className="text-xs text-muted-foreground text-center">
    Gift will arrive on or before <span className="font-medium text-foreground">{format(effectiveDate, 'PPP')}</span>
  </p>
)}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` | Add condition to hide date preview in holiday mode until a holiday is selected |

---

## Result

- **Holiday mode**: Date preview appears only after selecting a holiday/event
- **Specific mode**: Date preview always visible (the picker defines the date)
- Eliminates the confusing "February 4th" default when no selection has been made
