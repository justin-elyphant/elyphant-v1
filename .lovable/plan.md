
# Responsive Date Picker: Desktop Dropdowns vs Mobile Scroll Wheel

## Overview

Create a device-aware date selection experience that uses point-and-click dropdown selects on desktop while preserving the iOS-style scroll wheel picker on mobile/tablet devices.

---

## Current vs Proposed Layout

```text
DESKTOP (lg and up):                        MOBILE/TABLET (md and below):
┌────────────────────────────────────┐      ┌────────────────────────────────────┐
│ Delivery Date                      │      │ Delivery Date                      │
│ ┌──────────┐ ┌──────────┐ ┌──────┐ │      │ ┌──────────────────────────────┐   │
│ │ January▼ │ │ 15     ▼ │ │2027▼ │ │      │ │   January    15    2027      │   │
│ └──────────┘ └──────────┘ └──────┘ │      │ │   ◄─────────────────────►    │   │
│                                    │      │ └──────────────────────────────┘   │
│ Popular Holidays/Events            │      │                                    │
│ ┌────────────────────────────────┐ │      │ Popular Holidays/Events            │
│ │ Select a holiday...         ▼  │ │      │ ┌────────────────────────────────┐ │
│ └────────────────────────────────┘ │      │ │ Select a holiday...         ▼  │ │
└────────────────────────────────────┘      │ └────────────────────────────────┘ │
                                            └────────────────────────────────────┘
```

---

## Key Changes

1. **New `DropdownDatePicker` Component**: Three inline Select dropdowns for Month, Day, Year with proper z-index and event handling for nested dialogs

2. **Conditional Rendering in Modal**: Use `useIsMobile(1024)` to determine which picker to show:
   - Desktop (≥1024px): DropdownDatePicker
   - Mobile/Tablet (<1024px): Existing iOS scroll wheel Picker

3. **Shared State**: Both picker types will use the same `pickerValue` state (`{ month, day, year }`) so switching between them or selecting holidays syncs correctly

---

## Technical Implementation

### Phase 1: Create DropdownDatePicker Component

**New File**: `src/components/ui/dropdown-date-picker.tsx`

```typescript
interface DropdownDatePickerProps {
  value: { month: string; day: string; year: string };
  onChange: (value: { month: string; day: string; year: string }) => void;
  className?: string;
}
```

**Key Features**:
- Three Radix Select components in a horizontal flex row
- `onPointerDown={(e) => e.stopPropagation()}` on triggers (for nested dialog compatibility)
- `z-[9999]` and `position="popper"` on SelectContent
- Days dynamically calculated based on selected month/year
- Compact styling matching modal aesthetic

**UI Structure**:
```typescript
<div className="grid grid-cols-3 gap-2">
  {/* Month Select */}
  <Select value={month} onValueChange={handleMonthChange}>
    <SelectTrigger onPointerDown={(e) => e.stopPropagation()}>
      <SelectValue placeholder="Month" />
    </SelectTrigger>
    <SelectContent className="z-[9999]" position="popper">
      {months.map(...)}
    </SelectContent>
  </Select>
  
  {/* Day Select */}
  <Select value={day} onValueChange={handleDayChange}>
    ...
  </Select>
  
  {/* Year Select */}
  <Select value={year} onValueChange={handleYearChange}>
    ...
  </Select>
</div>
```

### Phase 2: Update UnifiedGiftSchedulingModal.tsx

**Replace** the current Picker section (lines 500-530) with conditional rendering:

```typescript
{/* Date Picker - Responsive */}
<div className="bg-muted/30 rounded-lg py-3 px-2">
  {isMobile ? (
    // Mobile/Tablet: iOS Scroll Wheel
    <Picker
      value={pickerValue}
      onChange={(value) => handlePickerChange(value)}
      wheelMode="natural"
      height={160}
    >
      {/* ... existing columns ... */}
    </Picker>
  ) : (
    // Desktop: Dropdown Selects
    <DropdownDatePicker
      value={pickerValue}
      onChange={handlePickerChange}
    />
  )}
</div>
```

**Note**: The `isMobile` hook is already imported with breakpoint 1024, so tablets (768-1023px) will get the scroll picker, matching iOS Capacitor behavior.

---

## Component Changes Summary

| Component | Changes |
|-----------|---------|
| `src/components/ui/dropdown-date-picker.tsx` | **NEW** - Desktop dropdown date picker with Month/Day/Year selects |
| `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` | Conditional render: DropdownDatePicker on desktop, Picker on mobile/tablet |

---

## Visual Design

**Dropdown Styling**:
- Use existing Radix Select with `bg-background` triggers
- Compact height matching modal inputs
- Month dropdown slightly wider to accommodate long names (flex-[1.5])
- Day and Year equal width (flex-1)

**Responsive Breakpoint**:
- Uses existing `useIsMobile(1024)` hook
- Desktop: ≥1024px width
- Mobile/Tablet: <1024px width

---

## User Experience

| Device | Behavior |
|--------|----------|
| **Desktop** | Click dropdowns to select month, day, year - precise point-and-click |
| **Tablet** | iOS scroll wheel - natural touch gestures |
| **Mobile** | iOS scroll wheel - optimized for finger scrolling |

---

## Benefits

1. **Trackpad Friendly**: Eliminates scroll sensitivity issues on desktop
2. **Familiar Pattern**: Desktop users expect dropdowns for date selection
3. **Touch Optimized**: Mobile/tablet keeps the native-feeling scroll wheel
4. **Consistent State**: Same `pickerValue` state works for both picker types
5. **Holiday Sync**: Selecting a holiday updates both picker types correctly
