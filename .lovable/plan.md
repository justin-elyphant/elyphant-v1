

# Consolidate Recurring Gift Setup into Unified Schedule Gift Modal

## Overview

Replace the 3-step wizard (`AutoGiftSetupFlow`, 1,074 lines) with the cleaner single-page `UnifiedGiftSchedulingModal` (781 lines) across the entire app. The modal already has recipient selection, date coaching, gift message, and recurring toggle (`RecurringToggleSection`). We add **standalone mode** (no product), **rule editing**, and **multi-event support** -- all while maintaining iOS Capacitor compliance (44px touch targets, haptic feedback, safe area padding, Drawer on mobile/tablet, Dialog on desktop).

---

## What Gets Added to UnifiedGiftSchedulingModal

### A. Standalone Mode (no product required)

New boolean prop `standaloneMode`. When true:
- Title changes to "Set Up Recurring Gift" (or "Edit Recurring Gift" when editing)
- Submit button says "Create Recurring Rule" or "Save Changes"
- Cart logic is skipped entirely -- only recurring rules are created/updated
- The recurring toggle is always ON and hidden (the whole point is recurring setup)

### B. Rule Editing

New props `editingRule` and `ruleId`. When provided:
- Pre-populate all form fields: recipient, date/preset, budget, payment method, notification days, auto-approve, gift message
- Submit calls `updateRule(ruleId, ...)` instead of `createRule(...)`
- Title shows "Edit Recurring Gift"

### C. Multi-Event Selection (standalone mode only)

When `standaloneMode` is true:
- Replace the single-event selectors (`DeliveryTypeSelector` + `PresetHolidaySelector` / date picker) with the existing `MultiEventSelector` component
- This preserves the power-user ability to select Birthday + Christmas + Mother's Day in one flow
- When `standaloneMode` is false (product page), keep the current single-event flow unchanged

### D. Responsive Layout Compliance

The modal already uses `useIsMobile(1024)` to choose Drawer vs Dialog rendering:
- **Phone + Tablet (below 1024px):** Drawer with `max-h-[90vh] pb-safe`, sticky DrawerFooter, iOS momentum scrolling
- **Desktop (1024px+):** Dialog with `sm:max-w-md max-h-[90vh] flex flex-col`, sticky footer via `flex-shrink-0 border-t`
- All interactive elements already meet 44px minimum touch targets (`min-h-[44px]`)
- Haptic feedback already fires on submit (`triggerHapticFeedback('success')`)
- Text inputs use `text-base` (16px) to prevent iOS zoom

For the multi-event addition:
- `MultiEventSelector` already uses `grid-cols-1 md:grid-cols-2` for responsive grid
- Checkbox items have `p-4` padding (meeting 44px+ targets)
- The selector's `Select All` / `Deselect All` button has adequate touch area
- The expandable `MultiHolidaySelector` and `DatePicker` sub-sections render inline, staying within the scrollable content area

---

## Implementation Sequence

### Step 1: Enhance UnifiedGiftSchedulingModal (~80 lines)

**File:** `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx`

New props interface additions:

```text
standaloneMode?: boolean
editingRule?: {
  id: string
  recipient_id?: string
  pending_recipient_email?: string
  date_type: string
  budget_limit: number
  payment_method_id?: string
  notification_preferences?: { days_before: number[], email: boolean }
  auto_approve?: boolean
  gift_message?: string
}
ruleId?: string
initialRecipient?: SelectedRecipient
productHints?: ProductHints
```

Conditional rendering in `modalContent`:
- **Date section:** If `standaloneMode`, render `MultiEventSelector` instead of `DeliveryTypeSelector` + `PresetHolidaySelector`
- **Recurring toggle:** If `standaloneMode`, hide the toggle entirely (recurring is implicit) but show its expandable settings inline (budget, payment, notifications, auto-approve)
- **Title/CTA text:** Dynamic based on `standaloneMode` and `ruleId`

Submit logic fork in `handleSchedule()`:
- If `standaloneMode` and multi-events selected: call `unifiedGiftManagementService.createBatchRulesForRecipient()` (already exists in the service)
- If `standaloneMode` and `ruleId`: call `updateRule(ruleId, data)`
- If not standalone: existing cart + optional recurring rule flow (unchanged)

Port essential business logic from `AutoGiftSetupFlow`:
- Auto-connection creation for email recipients (the `createPendingConnection` flow when `recipientId` is an email)
- Pending invitation detection and messaging
- Input validation for multi-events (incomplete holidays, missing dates)
- Draft persistence via `useLocalStorage` (only in standalone mode)

### Step 2: Update /recurring-gifts Page

**File:** `src/pages/RecurringGifts.tsx`

- Replace `AutoGiftSetupFlow` import with `UnifiedGiftSchedulingModal`
- Pass `standaloneMode={true}`
- Map `editingRule` data to new prop shape (recipient, date_type, budget, payment, notifications)
- Remove `onRequestEditRule` (the unified modal handles this internally via pre-population)

### Step 3: Update All Consumer Files (prop mapping only)

Each consumer replaces `AutoGiftSetupFlow` with `UnifiedGiftSchedulingModal` and adds `standaloneMode={true}`:

| # | File | Current Props | Mapping Notes |
|---|------|--------------|---------------|
| 1 | `src/components/gifting/UpcomingEvents.tsx` | No props passed | Simple swap, `standaloneMode={true}` |
| 2 | `src/components/gifting/events/views/EnhancedEventsContainer.tsx` | Search needed | Same pattern |
| 3 | `src/components/gifting/events/add-dialog/AddEventDialog.tsx` | No props | `standaloneMode={true}` |
| 4 | `src/components/gifting/events/automated-tab/AutomatedGiftingTabContent.tsx` | `ruleId`, `initialData` | Map to `editingRule` |
| 5 | `src/components/cart/RecipientPackagePreview.tsx` | `recipientId`, `eventType`, `productHints` | Map to `initialRecipient`, `standaloneMode={true}` |
| 6 | `src/components/dashboard/GiftingHubCard.tsx` | No props | `standaloneMode={true}` |
| 7 | `src/components/connections/FriendCard.tsx` | `recipientId` | Map to `initialRecipient` |
| 8 | `src/components/user-profile/InlineWishlistViewer.tsx` | `recipientId`, `productHints` | Map to `initialRecipient` + `productHints` |
| 9 | `src/components/ai/SimpleNicolePopup.tsx` | `initialData` from Nicole AI | Map to `editingRule` or `initialRecipient` |
| 10 | `src/components/search/nicole/NicoleSearchDropdown.tsx` | No props | `standaloneMode={true}` |
| 11 | `src/components/gifting/unified/MyGiftsDashboardSimplified.tsx` | `onEditRule` callback | Already uses callback, no modal rendered |
| 12 | `src/components/test/PhaseCompletionStatus.tsx` | Comment reference only | Update comment text |
| 13 | `src/pages/RecurringGifts.tsx` | Covered in Step 2 | -- |

### Step 4: Delete AutoGiftSetupFlow and Orphaned Sub-Components

Files to delete (~1,500 lines removed):
- `src/components/gifting/auto-gift/AutoGiftSetupFlow.tsx` (1,074 lines)
- `src/components/gifting/auto-gift/RecipientSearchCombobox.tsx` (only used by AutoGiftSetupFlow)
- `src/components/gifting/auto-gift/SmartHolidayInfo.tsx` (only used by AutoGiftSetupFlow)
- `src/components/gifting/auto-gift/AddressVerificationWarning.tsx` (only used by AutoGiftSetupFlow)

Files to keep:
- `MultiEventSelector.tsx` -- reused by the unified modal
- `MultiHolidaySelector.tsx` -- reused by MultiEventSelector
- `RecurringToggleSection.tsx` -- reused by the unified modal
- `SimpleRecipientSelector.tsx` -- already used by the unified modal
- `PresetHolidaySelector.tsx` -- still used for single-event product-page flow
- `DeliveryTypeSelector.tsx` -- still used for single-event product-page flow

---

## iOS Capacitor and Responsive Compliance Checklist

All items below are already handled by the existing `UnifiedGiftSchedulingModal` patterns. The multi-event additions will inherit these:

- [x] **44px+ touch targets** -- All buttons use `min-h-[44px]`, checkboxes in `MultiEventSelector` have `p-4` containers
- [x] **Haptic feedback** -- `triggerHapticFeedback('selection')` on recipient change, `triggerHapticFeedback('success')` on submit, `triggerHapticFeedback('light')` on budget/notification toggles
- [x] **Safe area padding** -- Drawer uses `pb-safe`, footer uses safe area inset calc
- [x] **Drawer on mobile/tablet** -- `useIsMobile(1024)` breakpoint triggers Drawer below 1024px, Dialog above
- [x] **iOS scroll prevention** -- `text-base` (16px) on inputs prevents zoom, `ios-smooth-scroll` class on content
- [x] **Desktop flex layout** -- Dialog uses `flex flex-col` with `overflow-y-auto flex-1` for scrollable middle and `flex-shrink-0` footer
- [x] **Tablet content density** -- MultiEventSelector's `grid-cols-1 md:grid-cols-2` provides 2-column layout on tablets
- [x] **No custom gesture interception** -- Uses native scroll only, no touch event hijacking
- [x] **Spring animations** -- `motion.div` with `whileTap` scale for button feedback, `AnimatePresence` for section transitions

---

## What Stays the Same (Zero Changes)

- All backend edge functions (approve-auto-gift, auto-gift-orchestrator, etc.)
- `UnifiedGiftManagementService.ts` (createRule, updateRule, createBatchRulesForRecipient)
- `RecurringToggleSection` component
- `SimpleRecipientSelector` component
- `PresetHolidaySelector` / `DeliveryTypeSelector` for product-page flows
- `GroupedRulesSection` on /recurring-gifts page
- Database tables (auto_gifting_rules, auto_gift_notifications, etc.)

## Net Impact

- ~80 lines added to `UnifiedGiftSchedulingModal`
- ~1,500 lines deleted (AutoGiftSetupFlow + 3 orphaned sub-components)
- 12 consumer files updated (import swap + prop mapping)
- Net reduction: ~1,400 lines
- Zero new components, zero new dependencies, zero backend changes

