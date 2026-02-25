

# Fix Day Dropdown Scroll Inside Dialog on Tablet

## Problem

On tablet (iPad landscape ~1180px), `useIsMobile(1024)` returns `false`, so the modal renders the **DropdownDatePicker** (Radix Select dropdowns) instead of the scroll-wheel picker. The day dropdown has 28-31 items inside a `max-h-[200px]` container, but the parent Dialog intercepts the scroll/wheel events, making it impossible to scroll through the day list. Days beyond what fits in the visible area are effectively hidden and unreachable.

The year range is fine at 2 years -- no change needed there.

## Solution

Add `onWheel={(e) => e.stopPropagation()}` to the `SelectContent` elements for **month** and **day** in `dropdown-date-picker.tsx`. This prevents the Dialog from capturing scroll events that belong to the dropdown list. Also bump `max-h` from `200px` to `250px` for better tablet usability.

## Changes

### File: `src/components/ui/dropdown-date-picker.tsx`

**Month SelectContent (line 58-59):**
```
// Before
<SelectContent className="z-[9999] bg-background pointer-events-auto max-h-[200px]" position="popper">

// After
<SelectContent className="z-[9999] bg-background pointer-events-auto max-h-[250px]" position="popper" onWheel={(e) => e.stopPropagation()}>
```

**Day SelectContent (line 78-79):**
```
// Before
<SelectContent className="z-[9999] bg-background pointer-events-auto max-h-[200px]" position="popper">

// After
<SelectContent className="z-[9999] bg-background pointer-events-auto max-h-[250px]" position="popper" onWheel={(e) => e.stopPropagation()}>
```

## Scope

1 file, 2 lines changed. No logic changes, no backend impact.

