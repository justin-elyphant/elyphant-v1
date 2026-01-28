

# Fix: Preserve User's Delivery Type Selection When Choosing Recipient

## Problem Analysis

The modal flow is:
1. User opens modal → sees date selection first
2. User explicitly chooses **"Specific Date"** and picks February 4, 2026
3. User selects recipient (Charles Meeks)
4. **Bug**: System auto-switches to "Holiday / Event" because Charles has upcoming events

This happens because of a `useEffect` on lines 212-216:
```typescript
useEffect(() => {
  if (selectedRecipient) {
    setDeliveryType(hasUpcomingEvents ? 'holiday' : 'specific');
  }
}, [hasUpcomingEvents, selectedRecipient]);
```

The logic was designed for when recipient came **first** (so we could set a smart default). But now that date selection comes first, this effect overrides the user's explicit choice.

---

## UX Best Practice

**Never override an explicit user selection with an automatic default.**

The smart default should only apply when:
1. The modal opens fresh (no selection made yet), OR
2. The recipient changes AND the user hasn't explicitly touched the date type yet

This follows the principle: **"Be helpful with defaults, but respect explicit choices."**

---

## Solution

**Track whether the user has explicitly interacted with the delivery type selector.** Only apply the smart default if they haven't.

### Implementation Pattern

```typescript
// Add a "user has interacted" flag
const [deliveryTypeUserSet, setDeliveryTypeUserSet] = useState(false);

// Update handler to mark explicit choice
const handleDeliveryTypeChange = (type: DeliveryType) => {
  setDeliveryType(type);
  setDeliveryTypeUserSet(true); // User made an explicit choice
};

// Only auto-set if user hasn't explicitly chosen
useEffect(() => {
  if (selectedRecipient && !deliveryTypeUserSet) {
    setDeliveryType(hasUpcomingEvents ? 'holiday' : 'specific');
  }
}, [hasUpcomingEvents, selectedRecipient, deliveryTypeUserSet]);

// Reset the flag when modal opens
useEffect(() => {
  if (open) {
    setDeliveryTypeUserSet(false);
    // ... other resets
  }
}, [open, ...]);
```

---

## Technical Changes

### File: `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx`

| Location | Change |
|----------|--------|
| ~Line 106 | Add state: `const [deliveryTypeUserSet, setDeliveryTypeUserSet] = useState(false);` |
| Lines 212-216 | Update useEffect to check `!deliveryTypeUserSet` before auto-setting |
| Lines 228-257 | Add `setDeliveryTypeUserSet(false)` in the modal reset useEffect |
| ~Line 500 (in modalContent) | Update `onTypeChange` to also call `setDeliveryTypeUserSet(true)` |

---

## Expected Behavior After Fix

| Scenario | Before | After |
|----------|--------|-------|
| Modal opens, user picks Specific Date, then selects recipient | ❌ Switches to Holiday | ✅ Stays on Specific Date |
| Modal opens, user picks recipient first (no date type selected) | ✅ Smart default applies | ✅ Smart default still applies |
| Modal opens, user picks Holiday, then picks different recipient | ❌ May switch | ✅ Stays on Holiday |
| Modal re-opens fresh | ✅ Resets | ✅ Resets (flag cleared) |

---

## Alternative Considered

**Remove the smart default entirely**: Simpler, but loses the helpful "nudge" for users who haven't made a date choice yet. The tracking approach preserves the helpfulness for new users while respecting explicit choices.

