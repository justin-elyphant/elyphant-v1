

# Gift Scheduling Coaching Flow: "Holiday or Specific Date?"
## iOS Capacitor Compliant Implementation

---

## Verified Current State

After reviewing the codebase:
- **`UnifiedGiftSchedulingModal.tsx`** (688 lines): Uses `isMobile = useIsMobile(1024)` for responsive behavior
- **Delivery Date section**: Lines 495-548 (date picker) + Lines 550-558 (PresetHolidaySelector)
- **`triggerHapticFeedback`** utility: Fully implemented with Capacitor native support
- **`PresetHolidaySelector`**: Already handles birthday + important dates + standard holidays

---

## What We're Adding

A coaching question UI **before** the date picker that asks users to choose their intent:

```text
CURRENT LAYOUT (lines 495-558):          PROPOSED LAYOUT:
┌────────────────────────────────┐       ┌────────────────────────────────┐
│ Delivery Date                  │       │ When should this gift arrive?  │
│ ┌────────────────────────────┐ │       │                                │
│ │   Date Picker (scroll/DD)  │ │       │ ┌────────────┐ ┌─────────────┐ │
│ └────────────────────────────┘ │       │ │  🎄        │ │  📅         │ │
│                                │       │ │ Holiday/   │ │ Specific    │ │
│ Popular Holidays/Events        │       │ │ Event      │ │ Date        │ │
│ ┌────────────────────────────┐ │       │ └──[SELECT]──┘ └─────────────┘ │
│ │  Dropdown                  │ │       │                                │
│ └────────────────────────────┘ │       │ [Show Holiday picker OR        │
└────────────────────────────────┘       │  Date picker based on choice]  │
                                         └────────────────────────────────┘
```

---

## iOS Capacitor Standards ✓

| Requirement | Implementation |
|-------------|----------------|
| **44px+ Touch Targets** | `min-h-[56px]` on cards (exceeds minimum) |
| **Haptic Feedback** | `triggerHapticFeedback('selection')` on tap |
| **Spring Animations** | `framer-motion` with `whileTap={{ scale: 0.98 }}` |
| **Safe Areas** | Inherits from parent Drawer/Dialog (already compliant) |
| **No Gesture Interception** | Pure click handlers, no custom scroll hooks |
| **Touch Action** | `touch-action: manipulation` to prevent zoom delay |

---

## Technical Implementation

### File 1: NEW `src/components/gifting/unified/DeliveryTypeSelector.tsx`

A two-card toggle component:

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
  const handleSelect = (type: DeliveryType) => {
    if (disabled || type === selectedType) return;
    triggerHapticFeedback('selection'); // iOS Capacitor haptic
    onTypeChange(type);
  };

  return (
    <div className={cn(
      "grid grid-cols-2 gap-2",
      disabled && "opacity-50 pointer-events-none",
      className
    )}>
      {/* Holiday/Event Card */}
      <motion.button
        type="button"
        onClick={() => handleSelect('holiday')}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-colors",
          "min-h-[56px] touch-action-manipulation",
          selectedType === 'holiday'
            ? "bg-primary/5 border-primary"
            : "bg-background border-border"
        )}
      >
        <CalendarHeart className={cn("h-5 w-5", selectedType === 'holiday' ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("text-sm font-medium", selectedType === 'holiday' ? "text-foreground" : "text-muted-foreground")}>
          Holiday / Event
        </span>
        <span className="text-xs text-muted-foreground">For a special occasion</span>
      </motion.button>

      {/* Specific Date Card */}
      <motion.button
        type="button"
        onClick={() => handleSelect('specific')}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-colors",
          "min-h-[56px] touch-action-manipulation",
          selectedType === 'specific'
            ? "bg-primary/5 border-primary"
            : "bg-background border-border"
        )}
      >
        <Calendar className={cn("h-5 w-5", selectedType === 'specific' ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("text-sm font-medium", selectedType === 'specific' ? "text-foreground" : "text-muted-foreground")}>
          Specific Date
        </span>
        <span className="text-xs text-muted-foreground">Pick an exact date</span>
      </motion.button>
    </div>
  );
};

export default DeliveryTypeSelector;
```

---

### File 2: MODIFY `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx`

**Changes Required:**

#### 1. Add import (line ~27):
```typescript
import DeliveryTypeSelector, { DeliveryType } from './DeliveryTypeSelector';
import { AnimatePresence, motion } from 'framer-motion';
```

#### 2. Add new state (after line 104):
```typescript
// Delivery type coaching state
const [deliveryType, setDeliveryType] = useState<DeliveryType>('holiday');
```

#### 3. Add smart default logic (after line 184):
```typescript
// Check if recipient has upcoming events within 60 days for smart default
const hasUpcomingEvents = useMemo(() => {
  if (!selectedRecipient) return false;
  
  const now = new Date();
  const futureWindow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  
  // Check birthday
  if (recipientDobForPresets) {
    const birthday = calculateNextBirthday(recipientDobForPresets);
    if (birthday && birthday <= futureWindow) return true;
  }
  
  // Check important dates
  return recipientImportantDatesForPresets.some(date => {
    const nextDate = new Date(date.date);
    return nextDate <= futureWindow;
  });
}, [recipientDobForPresets, recipientImportantDatesForPresets, selectedRecipient]);

// Set initial delivery type when recipient changes
useEffect(() => {
  if (selectedRecipient) {
    setDeliveryType(hasUpcomingEvents ? 'holiday' : 'specific');
  }
}, [hasUpcomingEvents, selectedRecipient]);
```

#### 4. Replace Delivery Date section (lines 495-558) with:
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
        setSelectedPreset(null); // Clear holiday selection
        setSelectedDate(null);
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
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        {/* Holiday dropdown first */}
        <PresetHolidaySelector
          selectedPreset={selectedPreset}
          recipientDob={recipientDobForPresets}
          recipientName={selectedRecipient?.type === 'connection' ? selectedRecipient.connectionName : undefined}
          recipientImportantDates={recipientImportantDatesForPresets}
          onPresetSelect={handlePresetSelect}
          onClear={handlePresetClear}
        />
        
        {/* Date picker below, synced to holiday */}
        <div className="bg-muted/30 rounded-lg py-3 px-2">
          {isMobile ? (
            <Picker
              value={pickerValue}
              onChange={(value) => handlePickerChange(value as { month: string; day: string; year: string })}
              wheelMode="natural"
              height={160}
            >
              <Picker.Column name="month">
                {months.map((month) => (
                  <Picker.Item key={month} value={month}>{month}</Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name="day">
                {days.map((day) => (
                  <Picker.Item key={day} value={day}>{day}</Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name="year">
                {years.map((year) => (
                  <Picker.Item key={year} value={year}>{year}</Picker.Item>
                ))}
              </Picker.Column>
            </Picker>
          ) : (
            <DropdownDatePicker
              value={pickerValue}
              onChange={handlePickerChange}
            />
          )}
        </div>
      </motion.div>
    ) : (
      <motion.div
        key="specific-flow"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {/* Specific date: Just show date picker */}
        <div className="bg-muted/30 rounded-lg py-3 px-2">
          {isMobile ? (
            <Picker
              value={pickerValue}
              onChange={(value) => handlePickerChange(value as { month: string; day: string; year: string })}
              wheelMode="natural"
              height={160}
            >
              <Picker.Column name="month">
                {months.map((month) => (
                  <Picker.Item key={month} value={month}>{month}</Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name="day">
                {days.map((day) => (
                  <Picker.Item key={day} value={day}>{day}</Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name="year">
                {years.map((year) => (
                  <Picker.Item key={year} value={year}>{year}</Picker.Item>
                ))}
              </Picker.Column>
            </Picker>
          ) : (
            <DropdownDatePicker
              value={pickerValue}
              onChange={handlePickerChange}
            />
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  
  {/* Selected Date Preview */}
  {effectiveDate && (
    <p className="text-xs text-muted-foreground text-center">
      Gift will arrive on or before <span className="font-medium text-foreground">{format(effectiveDate, 'PPP')}</span>
    </p>
  )}
</div>
```

---

## Files Summary

| File | Action | Lines Affected |
|------|--------|----------------|
| `src/components/gifting/unified/DeliveryTypeSelector.tsx` | **CREATE** | New file (~60 lines) |
| `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` | **MODIFY** | Lines 27, 104, 184, 495-558 |

---

## User Experience Flow

| Device | Step 1: Choose Type | Step 2: Pick Date |
|--------|---------------------|-------------------|
| **Mobile** | Tap card (haptic) | iOS scroll wheel + holiday dropdown (if holiday) |
| **Tablet** | Tap card (haptic) | iOS scroll wheel + holiday dropdown (if holiday) |
| **Desktop** | Click card | Dropdown selects + holiday dropdown (if holiday) |

---

## Smart Defaults

- If recipient has birthday/event within 60 days → **"Holiday/Event"** pre-selected
- Otherwise → **"Specific Date"** pre-selected
- Switching to "Specific Date" clears any selected holiday preset

