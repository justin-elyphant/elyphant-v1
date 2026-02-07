
# Fix "Just Because" Date Picker in Multi-Event Selector

## Problem

When selecting "Just Because" in the standalone recurring gift modal, the date picker button ("Pick a date") doesn't respond to clicks on desktop. This happens because the current `DatePicker` component (Popover + Calendar) is nested inside a Dialog, and the Popover's click events are intercepted by the parent Dialog layer -- a known interactivity issue with nested Radix UI components.

Additionally, the "Just Because" date picker uses a completely different component (`DatePicker` = Popover + Calendar popup) than the product-level "Specific Date" flow (which uses `DropdownDatePicker` on desktop / scroll wheel on mobile). This creates an inconsistent experience.

## Solution

Replace the broken `DatePicker` in the "Just Because" section with the same proven date selection pattern used by the product-level "Specific Date" flow: `DropdownDatePicker` on desktop, `react-mobile-picker` on mobile/tablet.

This simultaneously:
1. Fixes the broken click handling (no Popover nesting issues)
2. Creates a consistent date selection experience across the app
3. Reuses battle-tested components that already work inside Dialogs

## Changes

### File: `src/components/gifting/events/add-dialog/MultiEventSelector.tsx`

**Remove**: Import of `DatePicker` from `@/components/ui/date-picker`

**Add**: Imports for `DropdownDatePicker`, `react-mobile-picker` (Picker), and `useIsMobile` hook -- matching the pattern in `UnifiedGiftSchedulingModal.tsx`

**Replace the "Just Because" date section** (lines 396-404):

Currently renders:
```text
<DatePicker
  date={...}
  setDate={handleDateSelected}
  disabled={(date) => date < today}
/>
```

New rendering (same pattern as the product "Specific Date" flow):
- Add local state for picker values (`pickerValue` with month/day/year)
- On desktop (1024px+): Render `DropdownDatePicker` with three inline Select dropdowns (Month, Day, Year)
- On mobile/tablet (below 1024px): Render `Picker` scroll wheel with three columns
- When picker value changes, convert to a `Date` and call the existing `handleDateSelected` function
- Past dates are naturally prevented since the picker only offers the current year and next year, and the submit validation already checks minimum lead time

**Update `handleDateSelected`** to also accept the converted picker date and set picker values when a date is programmatically changed.

### Visual Result

```text
Before (broken):
+-- Just Because [x] --+
| Select Gift Date     |
| [Pick a date]  <-- doesn't respond to clicks
+----------------------+

After (desktop):
+-- Just Because [x] -----+
| Select Gift Date         |
| [February] [14] [2026]   |
+--------------------------+

After (mobile/tablet):
+-- Just Because [x] --+
| Select Gift Date     |
|  January      13     |
| >February<   >14<    |
|  March        15     |
+----------------------+
```

### What Stays the Same

- All other occasion cards (Birthday, Anniversary, Holiday, etc.) -- unchanged
- The `handleDateSelected` callback and `SelectedEvent` data shape -- unchanged
- The `DatePicker` component itself (other parts of the app may use it) -- unchanged
- Product-level "Specific Date" flow -- unchanged
- Mobile/tablet Drawer rendering -- unchanged
- iOS Capacitor compliance (44px targets, haptic feedback) -- preserved
- Backend logic -- zero changes
