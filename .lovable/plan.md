

# Gift Scheduling Coaching Flow: "Holiday or Specific Date?"
## With iOS Capacitor Compliance

---

## Overview

Add a coaching question before the date selection area to guide users through the scheduling process. This creates a clearer mental model and helps shoppers understand their options, while maintaining full iOS Capacitor compliance for mobile and tablet devices.

---

## Current vs Proposed Layout

```text
CURRENT FLOW:                               PROPOSED FLOW:
┌────────────────────────────────────┐      ┌────────────────────────────────────┐
│ 🎁 Schedule Gift                   │      │ 🎁 Schedule Gift                   │
│                                    │      │                                    │
│ Who is this gift for?              │      │ Who is this gift for?              │
│ ┌────────────────────────────────┐ │      │ ┌────────────────────────────────┐ │
│ │ Select recipient            ▼  │ │      │ │ Select recipient            ▼  │ │
│ └────────────────────────────────┘ │      │ └────────────────────────────────┘ │
│                                    │      │                                    │
│ ───────────────────────────────    │      │ ───────────────────────────────    │
│                                    │      │                                    │
│ Delivery Date                      │      │ When should this gift arrive?      │
│ ┌──────────┐ ┌──────────┐ ┌──────┐ │      │                                    │
│ │ February │ │ 3       ▼ │ │2026▼ │ │      │ ┌─────────────┐ ┌───────────────┐  │
│ └──────────┘ └──────────┘ └──────┘ │      │ │   🎄        │ │   📅          │  │
│                                    │      │ │ Holiday/    │ │ Specific      │  │
│ Popular Holidays/Events            │      │ │ Event       │ │ Date          │  │
│ ┌────────────────────────────────┐ │      │ └──[SELECTED]─┘ └───────────────┘  │
│ │ Select a holiday...         ▼  │ │      │                                    │
│ └────────────────────────────────┘ │      │ [Then show either Holiday picker   │
│                                    │      │  OR Date picker based on choice]   │
└────────────────────────────────────┘      └────────────────────────────────────┘
```

---

## iOS Capacitor Standards Checklist

| Requirement | Implementation |
|-------------|----------------|
| **44px Touch Targets** | Cards use `min-h-[56px]` (larger than minimum for better UX) |
| **Haptic Feedback** | `triggerHapticFeedback('selection')` on card tap |
| **Spring Animations** | `motion.div` with `type: 'spring', stiffness: 400, damping: 30` |
| **whileTap Scale** | `whileTap={{ scale: 0.98 }}` for tactile press feedback |
| **Safe Area Compatibility** | Inherits from parent modal's safe area handling |
| **Touch Action** | `touch-action: manipulation` to prevent zoom delays |
| **No Gesture Interception** | Native scroll behavior preserved (no custom touch hooks) |

---

## Design Decision: Two Clickable Cards

A toggle-style UI with two horizontally arranged cards (matching `SchedulingModeToggle` pattern):

| Option | Icon | Label | Description |
|--------|------|-------|-------------|
| **Holiday/Event** | CalendarHeart | "Holiday / Event" | "Arriving for a special occasion" |
| **Specific Date** | Calendar | "Specific Date" | "Pick an exact arrival date" |

### Why Cards over Radio Buttons?
- More visual and engaging for e-commerce context
- Easier to tap on mobile (56px touch targets exceed 44px minimum)
- Matches the Lululemon-inspired minimalist aesthetic
- Matches existing `SchedulingModeToggle` component pattern

---

## Behavior Logic

| Selection | What Shows Next |
|-----------|----------------|
| **Holiday/Event** | Show `PresetHolidaySelector` dropdown first, then date picker below synced to selection |
| **Specific Date** | Show date picker immediately (no holiday dropdown visible) |

### Smart Defaults
- If recipient has a birthday or important dates coming up within 60 days: **default to Holiday/Event**
- Otherwise: **default to Specific Date** (most common use case)

---

## Technical Implementation

### Phase 1: Create DeliveryTypeSelector Component

**New File**: `src/components/gifting/unified/DeliveryTypeSelector.tsx`

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { Calendar, CalendarHeart } from 'lucide-react';
import { triggerHapticFeedback } from '@/utils/haptics';
import { motion } from 'framer-motion';

export type DeliveryType = 'holiday' | 'specific';

interface DeliveryTypeSelectorProps {
  selectedType: DeliveryType;
  onTypeChange: (type: DeliveryType) => void;
  disabled?: boolean;
  className?: string;
}

const DeliveryTypeSelector: React.FC<DeliveryTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false,
  className
}) => {
  const handleTypeSelect = (newType: DeliveryType) => {
    if (disabled || newType === selectedType) return;
    triggerHapticFeedback('selection'); // iOS Capacitor haptic
    onTypeChange(newType);
  };

  return (
    <div className={cn(
      "relative grid grid-cols-2 gap-2",
      disabled && "opacity-50 pointer-events-none",
      className
    )}>
      {/* Holiday/Event Option */}
      <motion.button
        type="button"
        onClick={() => handleTypeSelect('holiday')}
        whileTap={{ scale: 0.98 }} // iOS tactile feedback
        className={cn(
          "relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-colors",
          "min-h-[56px]", // Exceeds 44px iOS touch target
          "touch-action-manipulation", // Prevent zoom delay
          selectedType === 'holiday'
            ? "bg-primary/5 border-primary"
            : "bg-background border-border hover:border-muted-foreground/30"
        )}
      >
        <CalendarHeart className={cn(
          "h-5 w-5",
          selectedType === 'holiday' ? "text-primary" : "text-muted-foreground"
        )} />
        <span className={cn(
          "text-sm font-medium",
          selectedType === 'holiday' ? "text-foreground" : "text-muted-foreground"
        )}>
          Holiday / Event
        </span>
        <span className="text-xs text-muted-foreground text-center">
          For a special occasion
        </span>
      </motion.button>

      {/* Specific Date Option */}
      <motion.button
        type="button"
        onClick={() => handleTypeSelect('specific')}
        whileTap={{ scale: 0.98 }} // iOS tactile feedback
        className={cn(
          "relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-colors",
          "min-h-[56px]", // Exceeds 44px iOS touch target
          "touch-action-manipulation", // Prevent zoom delay
          selectedType === 'specific'
            ? "bg-primary/5 border-primary"
            : "bg-background border-border hover:border-muted-foreground/30"
        )}
      >
        <Calendar className={cn(
          "h-5 w-5",
          selectedType === 'specific' ? "text-primary" : "text-muted-foreground"
        )} />
        <span className={cn(
          "text-sm font-medium",
          selectedType === 'specific' ? "text-foreground" : "text-muted-foreground"
        )}>
          Specific Date
        </span>
        <span className="text-xs text-muted-foreground text-center">
          Pick an exact date
        </span>
      </motion.button>
    </div>
  );
};

export default DeliveryTypeSelector;
```

### Phase 2: Update UnifiedGiftSchedulingModal.tsx

**New State**:
```typescript
const [deliveryType, setDeliveryType] = useState<'holiday' | 'specific'>('holiday');
```

**Smart Default Logic**:
```typescript
// Check if recipient has upcoming events within 60 days
const hasUpcomingEvents = useMemo(() => {
  if (!selectedRecipient) return false;
  const now = new Date();
  const futureWindow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  
  // Check birthday
  if (recipientDobForPresets) {
    // Parse and check if within window
    return true; // Simplified - actual implementation will calculate
  }
  
  return recipientImportantDatesForPresets.length > 0;
}, [recipientDobForPresets, recipientImportantDatesForPresets, selectedRecipient]);

// Set initial delivery type based on events
useEffect(() => {
  if (selectedRecipient) {
    setDeliveryType(hasUpcomingEvents ? 'holiday' : 'specific');
  }
}, [hasUpcomingEvents, selectedRecipient]);
```

**Updated Delivery Date Section**:
```typescript
{/* Delivery Date Section */}
<div className="space-y-3">
  <label className="text-sm font-semibold text-foreground block">
    When should this gift arrive?
  </label>
  
  {/* Step 1: Coaching Question */}
  <DeliveryTypeSelector
    selectedType={deliveryType}
    onTypeChange={(type) => {
      setDeliveryType(type);
      if (type === 'specific') {
        setSelectedPreset(''); // Clear holiday selection
      }
    }}
  />
  
  {/* Step 2: Conditional content based on selection */}
  <AnimatePresence mode="wait">
    {deliveryType === 'holiday' ? (
      <motion.div
        key="holiday-flow"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-3"
      >
        {/* Holiday dropdown first */}
        <PresetHolidaySelector {...props} />
        
        {/* Date picker below, synced */}
        <div className="bg-muted/30 rounded-lg py-3 px-2">
          {isMobile ? <Picker ... /> : <DropdownDatePicker ... />}
        </div>
      </motion.div>
    ) : (
      <motion.div
        key="specific-flow"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {/* Specific date: Just show date picker */}
        <div className="bg-muted/30 rounded-lg py-3 px-2">
          {isMobile ? <Picker ... /> : <DropdownDatePicker ... />}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  
  {/* Date confirmation */}
  {effectiveDate && (
    <p className="text-xs text-muted-foreground text-center">
      Gift will arrive on or before <span className="font-medium">{format(effectiveDate, 'PPP')}</span>
    </p>
  )}
</div>
```

---

## Visual Design (Monochromatic + iOS Native Feel)

### Card States
| State | Styling |
|-------|---------|
| **Default** | `bg-background border-border` |
| **Hover** | `border-muted-foreground/30` (subtle) |
| **Selected** | `bg-primary/5 border-primary` (Elyphant purple accent) |
| **Pressed** | `scale: 0.98` via framer-motion |

### Responsive Behavior
| Device | Layout |
|--------|--------|
| **Mobile** | 2-column grid, compact text, scroll wheel date picker |
| **Tablet** | 2-column grid, full descriptions, scroll wheel date picker |
| **Desktop** | 2-column grid, full descriptions, dropdown date picker |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/gifting/unified/DeliveryTypeSelector.tsx` | **CREATE** - New coaching component with iOS Capacitor compliance |
| `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` | **MODIFY** - Add state, smart defaults, and conditional rendering |

---

## User Experience Benefits

1. **Reduced Cognitive Load**: Users immediately understand their two paths
2. **Guided Journey**: Question format feels conversational
3. **Smart Defaults**: System anticipates user intent based on recipient data
4. **Cleaner UI**: Hiding the holiday dropdown when not needed reduces visual noise
5. **Native iOS Feel**: Haptics, spring animations, and proper touch targets
6. **Consistent Patterns**: Matches existing `SchedulingModeToggle` component

