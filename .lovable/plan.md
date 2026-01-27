

# Unified Hybrid Gift Scheduling Modal with Birthday Integration

## Overview

This plan transforms the current tab-based "One-Time vs Recurring" modal into a **single linear flow** where recurring is an optional toggle enhancement. Birthday is added as a special preset that dynamically pulls the recipient's birthday from their profile data.

---

## Architecture Changes

```text
CURRENT (Tab-Based):                    PROPOSED (Linear with Toggle):
┌─────────────────────────┐             ┌─────────────────────────────────────┐
│ [One-Time] [Recurring]  │             │ Schedule Gift                        │
├─────────────────────────┤             ├─────────────────────────────────────┤
│ One-Time:               │             │ Who is this gift for?               │
│ • Recipient             │             │ [SimpleRecipientSelector]           │
│ • Date picker           │             │                                     │
│ • Gift message          │  ────────►  │ Delivery Date                       │
├─────────────────────────┤             │ [Birthday*] [Christmas] [Valentine] │
│ Recurring:              │             │ [Mother's Day] [Other Date...]      │
│ • Completely separate   │             │                                     │
│   wizard (3 steps)      │             │ Gift Message (Optional)             │
│ • Step navigation       │             │ [Textarea]                          │
└─────────────────────────┘             │                                     │
                                        │ ─────────────────────────────────── │
                                        │ 🔄 Make this recurring      [OFF]   │
                                        │    ▼ Expands when ON:               │
                                        │    • Budget selector                │
                                        │    • Payment method                 │
                                        │    • Notification preferences       │
                                        │                                     │
                                        │ [Schedule Gift]                     │
                                        └─────────────────────────────────────┘

* Birthday chip is DYNAMIC - only appears when recipient has dob in profile
```

---

## Phase 1: Data Flow Enhancement

### Update `SelectedRecipient` Interface

Add `recipientDob` to carry birthday data through the selector:

```typescript
// src/components/marketplace/product-details/SimpleRecipientSelector.tsx
export interface SelectedRecipient {
  type: 'self' | 'connection' | 'later';
  connectionId?: string;
  connectionName?: string;
  shippingAddress?: { ... };
  addressVerified?: boolean;
  recipientDob?: string;  // NEW: MM-DD format from profile
}
```

### Update `EnhancedConnection` Interface

Include `dob` in connection data:

```typescript
// src/hooks/profile/useEnhancedConnections.ts
export interface EnhancedConnection {
  // ... existing fields
  profile_dob?: string | null;  // NEW: MM-DD format
}
```

### Update Profile Query

Fetch `dob` when retrieving connection profiles:

```typescript
// Line 84 in useEnhancedConnections.ts
.select('id, name, email, profile_image, bio, username, interests, important_dates, shipping_address, dob')
```

### Pass Birthday in `handleSelectConnection`

Update `SimpleRecipientSelector.tsx` to include birthday:

```typescript
onChange({
  type: 'connection',
  connectionId: connection.display_user_id || connection.connected_user_id || connection.id,
  connectionName: connection.profile_name || connection.pending_recipient_name || 'Recipient',
  shippingAddress,
  addressVerified: !!rawAddress,
  recipientDob: connection.profile_dob || undefined  // NEW
});
```

---

## Phase 2: New Components

### 2.1 PresetHolidaySelector.tsx

Horizontal chip selector for quick date selection:

```typescript
interface PresetHolidaySelectorProps {
  selectedPreset: string | null;
  selectedDate: Date | null;
  recipientDob?: string;  // MM-DD format - enables Birthday chip
  recipientName?: string;
  onPresetSelect: (presetKey: string, date: Date) => void;
  onCustomDateSelect: (date: Date) => void;
  showDatePicker: boolean;
  onToggleDatePicker: () => void;
}
```

**Features:**
- Horizontal scrollable chips: Birthday (conditional), Christmas, Valentine's Day, Mother's Day, Father's Day
- "Other Date..." chip that expands to iOS scroll picker
- Birthday chip ONLY appears if `recipientDob` is provided
- Birthday chip shows calculated next occurrence date
- Selected chip gets primary color highlight with checkmark

**UI Structure:**
```text
┌──────────────────────────────────────────────────────────┐
│ [🎂 Birthday (Mar 15)] [🎄 Christmas] [💝 Valentine's]   │
│ [👩 Mother's Day] [👨 Father's Day] [📅 Other Date...]   │
└──────────────────────────────────────────────────────────┘
          ▲ Scrollable horizontally on mobile
```

### 2.2 RecurringToggleSection.tsx

Collapsible section for recurring gift options:

```typescript
interface RecurringToggleSectionProps {
  isRecurring: boolean;
  onToggle: (enabled: boolean) => void;
  detectedHoliday: { key: string; label: string } | null;
  budget: number;
  onBudgetChange: (budget: number) => void;
  paymentMethodId: string;
  onPaymentMethodChange: (id: string) => void;
  autoApprove: boolean;
  onAutoApproveChange: (enabled: boolean) => void;
  notificationDays: number[];
  onNotificationDaysChange: (days: number[]) => void;
}
```

**Features:**
- Toggle switch with label "Make this a recurring gift"
- Subtitle explaining: "Automatically send a gift for this occasion every year"
- Animated expansion using framer-motion when toggled ON
- Embedded components:
  - Budget quick-select chips ($25, $50, $75, $100, Custom)
  - `UnifiedPaymentMethodManager` for saved cards
  - Auto-approve toggle
  - Notification preference (simplified - days before)

---

## Phase 3: Refactor UnifiedGiftSchedulingModal

### Remove Tab-Based Logic

Delete these imports and state:
- Remove `SchedulingModeToggle` import
- Remove tab-based `mode` state as primary controller
- Remove conditional rendering between `OneTimeContent` and `AutoGiftSetupFlow`

### Add New State

```typescript
// Preset/Holiday selection
const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

// Recurring toggle state
const [isRecurring, setIsRecurring] = useState(false);
const [budget, setBudget] = useState(50);
const [paymentMethodId, setPaymentMethodId] = useState('');
const [autoApprove, setAutoApprove] = useState(false);
const [notificationDays, setNotificationDays] = useState([7, 3, 1]);
```

### Smart Birthday Handling

When recipient is selected with a `recipientDob`:
1. Enable the Birthday chip in PresetHolidaySelector
2. Calculate next birthday date using existing `calculateNextBirthday` logic
3. If user selects Birthday chip, auto-populate date

```typescript
// Calculate next birthday when recipient has dob
const nextBirthdayDate = useMemo(() => {
  if (!selectedRecipient?.recipientDob) return null;
  const [month, day] = selectedRecipient.recipientDob.split('-').map(Number);
  if (!month || !day) return null;
  const now = new Date();
  const currentYear = now.getFullYear();
  const thisYearBirthday = new Date(currentYear, month - 1, day);
  return thisYearBirthday >= now 
    ? thisYearBirthday 
    : new Date(currentYear + 1, month - 1, day);
}, [selectedRecipient?.recipientDob]);
```

### Unified Submit Handler

Single CTA that handles both one-time and recurring:

```typescript
const handleSchedule = async () => {
  // Validate date
  if (!validateDate()) return;
  
  const selectedDate = getSelectedDate();
  const effectiveProductId = getEffectiveProductId?.() || String(product?.product_id || product?.id);
  
  // Step 1: ALWAYS add to cart (if product exists)
  if (product) {
    addToCart({ ...product, product_id: effectiveProductId });
    
    if (selectedRecipient && selectedRecipient.type !== 'later') {
      assignItemToRecipient(effectiveProductId, {
        connectionId: selectedRecipient.type === 'self' ? 'self' : selectedRecipient.connectionId,
        connectionName: selectedRecipient.type === 'self' ? userName : selectedRecipient.connectionName,
        deliveryGroupId: `gift_${Date.now()}`,
        scheduledDeliveryDate: selectedDate.toISOString(),
        giftMessage: giftMessage || undefined,
        shippingAddress: selectedRecipient.shippingAddress,
        address_verified: selectedRecipient.addressVerified
      });
    }
  }
  
  // Step 2: Create recurring rule ONLY if toggle is ON
  if (isRecurring && selectedRecipient?.connectionId) {
    const dateType = selectedPreset || 'custom';
    
    const ruleData = {
      recipient_id: selectedRecipient.connectionId,
      date_type: dateType,
      scheduled_date: selectedDate.toISOString().split('T')[0],
      budget_limit: budget,
      payment_method_id: paymentMethodId,
      notification_preferences: {
        enabled: true,
        days_before: notificationDays,
        email: true,
        push: false
      },
      gift_selection_criteria: buildProductHints(),
      is_active: true,
      auto_approve: autoApprove
    };
    
    await createRule(ruleData);
    
    triggerHapticFeedback('success');
    toast.success('Recurring gift set up!', {
      description: `Will also send a gift for ${getPresetLabel(dateType)} every year`
    });
  }
  
  // Success feedback
  const recipientText = selectedRecipient?.connectionName || userName;
  toast.success(isRecurring ? 'Gift scheduled + recurring rule created!' : 'Gift scheduled!', {
    description: `Will arrive for ${recipientText} on ${format(selectedDate, 'PPP')}`,
    action: product ? { label: 'View Cart', onClick: () => navigate('/cart') } : undefined
  });
  
  onComplete?.({
    mode: isRecurring ? 'recurring' : 'one-time',
    recipientId: selectedRecipient?.connectionId,
    scheduledDate: selectedDate.toISOString().split('T')[0],
    alsoAddedToCart: !!product
  });
  
  onOpenChange(false);
};
```

---

## Phase 4: Holiday Date Configuration

### Update holidayDates.ts

Add birthday as a special "dynamic" type:

```typescript
// src/constants/holidayDates.ts
export const PRESET_HOLIDAYS: Record<string, { label: string; icon: string; dynamic?: boolean }> = {
  birthday: { label: "Birthday", icon: "🎂", dynamic: true },  // Date comes from recipient
  christmas: { label: "Christmas", icon: "🎄" },
  valentine: { label: "Valentine's Day", icon: "💝" },
  mothers_day: { label: "Mother's Day", icon: "👩" },
  fathers_day: { label: "Father's Day", icon: "👨" }
};
```

---

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/marketplace/product-details/SimpleRecipientSelector.tsx` | **Modify** | Add `recipientDob` to interface and pass through on selection |
| `src/hooks/profile/useEnhancedConnections.ts` | **Modify** | Add `profile_dob` to interface and query |
| `src/components/gifting/unified/PresetHolidaySelector.tsx` | **Create** | Horizontal holiday chip selector with Birthday support |
| `src/components/gifting/unified/RecurringToggleSection.tsx` | **Create** | Collapsible recurring options section |
| `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` | **Major Refactor** | Remove tabs, add linear flow with toggle |
| `src/constants/holidayDates.ts` | **Modify** | Add PRESET_HOLIDAYS config with Birthday |
| `src/components/gifting/unified/SchedulingModeToggle.tsx` | **Keep** | Keep for backward compatibility in AutoGiftSetupFlow |

---

## Birthday Logic Flow

```text
┌─────────────────────────────────────────────────────────────────────┐
│                       USER SELECTS RECIPIENT                        │
├─────────────────────────────────────────────────────────────────────┤
│ 1. SimpleRecipientSelector fetches connection with dob              │
│ 2. Returns SelectedRecipient with recipientDob: "03-15"             │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESET HOLIDAY SELECTOR                         │
├─────────────────────────────────────────────────────────────────────┤
│ 3. Checks if recipientDob exists                                    │
│    ├─ YES: Show [🎂 Birthday (Mar 15)] chip                         │
│    └─ NO:  Hide Birthday chip, show other presets only              │
│                                                                      │
│ 4. User taps Birthday chip:                                         │
│    ├─ Calculate: 03-15 → Next occurrence = Mar 15, 2027             │
│    └─ Set selectedDate to calculated birthday                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       RECURRING TOGGLE                               │
├─────────────────────────────────────────────────────────────────────┤
│ 5. If user toggles "Make this recurring" ON:                        │
│    └─ date_type = "birthday" is saved to rule                       │
│    └─ Future years auto-calculate from recipient's dob              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## User Flow Example

**Scenario**: User schedules birthday gift for Mom

1. Opens modal → Selects "Mom" as recipient
2. `SimpleRecipientSelector` returns `{ ..., recipientDob: "03-15" }`
3. **Birthday chip appears**: "🎂 Birthday (Mar 15)"
4. User taps Birthday chip → Date auto-fills to Mar 15, 2027
5. User writes gift message
6. User toggles **"Make this recurring"** ON
7. Recurring section expands:
   - Budget: $75 (selected)
   - Payment method: Visa •••• 4242
   - Auto-approve: ON
8. User taps **"Schedule Gift"**
9. **Result**:
   - Product added to cart for Mar 15, 2027
   - Recurring rule created: `date_type: "birthday"` for Mom
   - Future birthdays will auto-trigger 7 days before

---

## Edge Cases

1. **Recipient has no birthday**: Birthday chip hidden, other presets shown
2. **Self-ship selected**: Birthday uses current user's dob from profile
3. **Pending invitation**: Birthday chip hidden (no profile access yet)
4. **Birthday already passed this year**: Calculate for next year
5. **Minimum lead time violation**: Toast error if birthday is within 7 days

---

## Technical Considerations

1. **Privacy Check**: Birthday visibility respects `data_sharing_settings.dob` via existing `can_view_profile` RPC
2. **Date Validation**: Enforce 7-day minimum lead time for both presets and custom dates
3. **Haptic Feedback**: Trigger on chip selection and toggle changes
4. **iOS Compliance**: 44px touch targets, 16px font for inputs
5. **Animation**: Use framer-motion for recurring section expand/collapse

