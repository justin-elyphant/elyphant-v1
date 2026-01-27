

# Delivery Date UI Redesign: Calendar First + Holiday Dropdown

## Overview

Redesign the Delivery Date section to show the calendar picker by default (always visible) and move holidays/events into a compact dropdown selector. This reduces visual clutter and makes date selection more intuitive.

---

## Current vs Proposed Layout

```text
CURRENT:                                    PROPOSED:
┌──────────────────────────────────┐       ┌──────────────────────────────────┐
│ Delivery Date                    │       │ Delivery Date                    │
│ ┌──────────────────────────────┐ │       │ ┌──────────────────────────────┐ │
│ │ [Birthday] [Xmas] [Val]      │ │       │ │   January    15    2027      │ │
│ │ [Mother's] [Father's] [Other]│ │  →→   │ │   ◄────────────────────►     │ │
│ └──────────────────────────────┘ │       │ └──────────────────────────────┘ │
│                                  │       │                                  │
│ ▼ (Hidden: iOS scroll wheel     │       │ Popular Holidays/Events          │
│    only shows on "Other" click) │       │ ┌──────────────────────────────┐ │
│                                  │       │ │ Select a holiday...       ▼ │ │
└──────────────────────────────────┘       │ │ • Birthday (Mar 15)         │ │
                                           │ │ • Valentine's Day (Feb 14)  │ │
                                           │ │ • Mother's Day (May 11)     │ │
                                           │ │ • Christmas (Dec 25)        │ │
                                           │ └──────────────────────────────┘ │
                                           └──────────────────────────────────┘
```

---

## Key Changes

1. **Calendar Picker Always Visible**: Move the iOS scroll wheel picker to be directly below "Delivery Date" title - no click required to reveal it

2. **New "Popular Holidays/Events" Section**: Add a labeled dropdown selector below the calendar

3. **Dropdown with Icons and Dates**: Each holiday option shows its emoji icon and calculated date inline

4. **Two-Way Sync**: Selecting a holiday updates the scroll picker; manually changing the picker clears the holiday selection

---

## Technical Implementation

### Phase 1: Refactor PresetHolidaySelector.tsx

Transform the horizontal scrolling chips into a dropdown select component:

**Remove:**
- Horizontal scrollable chip container
- Individual chip motion buttons
- "Other Date..." chip (no longer needed)

**Add:**
- Radix Select dropdown with holiday options
- Each SelectItem shows: `{icon} {label} ({date})`
- Birthday option conditionally included based on `recipientDob`

**New Props:**
```typescript
interface PresetHolidaySelectorProps {
  selectedPreset: string | null;
  recipientDob?: string;
  recipientName?: string;
  onPresetSelect: (presetKey: string, date: Date) => void;
  onClear: () => void;  // NEW: for when user manually changes date
  className?: string;
}
```

**New UI Structure:**
```typescript
<div className="space-y-2">
  <label className="text-sm font-semibold text-foreground">
    Popular Holidays/Events
  </label>
  <Select value={selectedPreset || ''} onValueChange={handleSelect}>
    <SelectTrigger>
      <SelectValue placeholder="Select a holiday..." />
    </SelectTrigger>
    <SelectContent>
      {holidayOptions.map((option) => (
        <SelectItem key={option.key} value={option.key}>
          <div className="flex items-center gap-2">
            <span>{option.icon}</span>
            <span>{option.label}</span>
            <span className="text-muted-foreground">({option.dateLabel})</span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### Phase 2: Update UnifiedGiftSchedulingModal.tsx

**Layout Changes:**

1. Move the iOS scroll wheel picker to render directly after "Delivery Date" label (remove AnimatePresence wrapper - always visible)

2. Add the "Popular Holidays/Events" dropdown below the scroll picker

3. Remove `showCustomDatePicker` state (no longer needed)

**New Section Order:**
```text
1. Recipient Selection
2. Separator
3. Delivery Date (title)
4. iOS Scroll Wheel Picker (always visible)
5. Selected Date Preview
6. Popular Holidays/Events (dropdown)
7. Separator
8. Gift Message
9. Recurring Toggle Section
10. Footer Buttons
```

**Two-Way Date Sync Logic:**

```typescript
// When user selects a holiday from dropdown
const handlePresetSelect = (presetKey: string, date: Date) => {
  setSelectedPreset(presetKey);
  setSelectedDate(date);
  // Update picker values to match
  setPickerValue({
    month: months[date.getMonth()],
    day: String(date.getDate()),
    year: String(date.getFullYear())
  });
};

// When user manually changes picker
const handlePickerChange = (value: { month: string; day: string; year: string }) => {
  setPickerValue(value);
  setSelectedPreset(null);  // Clear holiday selection
  setSelectedDate(null);    // Will recalculate from picker
};
```

---

## Component Changes Summary

| Component | Changes |
|-----------|---------|
| `PresetHolidaySelector.tsx` | Complete rewrite: horizontal chips → dropdown Select |
| `UnifiedGiftSchedulingModal.tsx` | Remove `showCustomDatePicker` state, always show picker, reorder sections |

---

## Visual Design

**Dropdown Styling:**
- Use existing Radix Select component (already styled with z-index, background, etc.)
- SelectItems with icon + label + date in muted color
- Placeholder: "Select a holiday..."
- When selected: shows "🎄 Christmas (Dec 25)" in trigger

**Scroll Picker Styling:**
- Keep existing `bg-muted/30 rounded-lg py-3` background
- Remove AnimatePresence animation (always visible)
- Keep existing Picker component and column structure

---

## User Flow

1. User opens "Schedule Gift" modal
2. Sees recipient selector first
3. Scrolls down to "Delivery Date" section
4. **Sees iOS scroll wheel picker immediately** - can spin to any date
5. Below picker, sees "Popular Holidays/Events" dropdown
6. If they select "Christmas" from dropdown → picker updates to Dec 25, 2026
7. If they then manually spin picker to Dec 26 → Christmas selection clears
8. Continue to gift message and recurring toggle

---

## Benefits

1. **Reduced Visual Clutter**: No horizontal scrolling pills taking up space
2. **Immediate Interaction**: Calendar picker visible right away
3. **Familiar Pattern**: Dropdowns are universally understood
4. **Space Efficient**: Dropdown collapses when not in use
5. **Two-Way Sync**: Intuitive behavior when switching between picker and presets

