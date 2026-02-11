

# Restructure Schedule Gift Modal: Lead with One-Time vs Recurring

## Overview

Restructure the product-mode scheduling modal so the **first question** is "One-Time or Recurring?" using the existing `SchedulingModeToggle` component. Both paths then follow the same flow: Recipient -> Occasion -> Message -> (Recurring settings if applicable). The "Holiday/Event" vs "Specific Date" two-card coaching step (`DeliveryTypeSelector`) is replaced by a unified occasion dropdown with a new "Just Because" option that reveals the date picker inline.

**Zero backend changes.** All edge functions (`create-checkout-session`, `stripe-webhook-v2`, `process-order-v2`, `scheduled-order-processor`, `auto-gift-orchestrator`, `zinc-webhook`) remain untouched. The proven payment pipeline is preserved exactly as-is.

## What Changes

### 1. `UnifiedGiftSchedulingModal.tsx` (product mode section only)

**A. Add SchedulingModeToggle at top of `modalContent` (before recipient selector, ~line 800)**
- Import and render `SchedulingModeToggle` when `!standaloneMode`
- Wire `mode` to map: `'one-time'` = `isRecurring: false`, `'recurring'` = `isRecurring: true`
- This replaces the buried conditional toggle that only appeared after selecting a holiday + connection

**B. Replace DeliveryTypeSelector + conditional blocks (~lines 854-961) with unified flow**
- Remove `DeliveryTypeSelector` render and its coaching cards
- Render `PresetHolidaySelector` directly (no coaching step needed)
- When "Just Because" is selected from the dropdown, show the date picker inline below
- When a holiday/event is selected, auto-calculate date (existing behavior, unchanged)
- Remove the `deliveryType`, `deliveryTypeUserSet` state variables and the `useEffect` that sets them

**C. Show RecurringToggleSection based on mode toggle (~lines 1000-1030)**
- Change condition from `allowModeSwitch && selectedRecipient?.type === 'connection' && selectedPreset` to simply `isRecurring`
- Pass a new `hideToggle={true}` prop so only the expanded settings (budget, payment, notifications, auto-approve) render -- the toggle header is redundant since the top-level `SchedulingModeToggle` controls this
- Remove the `connection` type check -- recurring should work for any recipient type

**D. Update section label (~line 857)**
- Change "When should this gift arrive?" to "What's the occasion?"

### 2. `PresetHolidaySelector.tsx`

- Add a "Just Because" option at the bottom of the `holidayOptions` array with key `just_because`, icon `🎁`, and no pre-calculated date
- When selected, emit `onPresetSelect('just_because', new Date())` as a signal to the parent
- Parent modal detects `selectedPreset === 'just_because'` and shows the date picker inline

### 3. `RecurringToggleSection.tsx`

- Add optional `hideToggle?: boolean` prop to the interface
- When `hideToggle` is true, skip rendering the toggle header card (lines 88-120) and show only the expanded settings content directly
- No changes to any of the settings content (budget, payment, notifications, auto-approve)

### 4. `SchedulingModeToggle.tsx`

- No changes needed -- component is already built and ready to use

## Files NOT Changed (Backend Pipeline Preserved)

| File | Reason |
|------|--------|
| `supabase/functions/create-checkout-session/` | Checkout session creation untouched |
| `supabase/functions/stripe-webhook-v2/` | Order creation from metadata untouched |
| `supabase/functions/process-order-v2/` | Zinc submission untouched |
| `supabase/functions/scheduled-order-processor/` | T-7 capture / T-3 fulfillment untouched |
| `supabase/functions/auto-gift-orchestrator/` | Recurring rule processing untouched |
| `supabase/functions/zinc-webhook/` | Zinc status callbacks untouched |
| `supabase/functions/approve-auto-gift/` | Approval + year rollover untouched |
| `supabase/functions/shared/paymentLeadTime.ts` | Lead time constants untouched |
| `src/lib/constants/paymentLeadTime.ts` | Frontend lead time constants untouched |
| `src/constants/holidayDates.ts` | Holiday calculation logic untouched |
| All database tables / RLS | No schema changes |

## New Modal Flow (Product Mode)

```text
Schedule Gift
  |
  +-- [One-Time | Recurring]  <-- SchedulingModeToggle (NEW position)
  |
  +-- Who is this gift for?
  |     SimpleRecipientSelector (unchanged)
  |
  +-- What's the occasion?  <-- Renamed from "When should this gift arrive?"
  |     PresetHolidaySelector dropdown:
  |       - Birthday (if recipient has DOB)
  |       - Recipient's custom dates (anniversaries, etc.)
  |       - Christmas, Valentine's Day, Mother's Day, etc.
  |       - "Just Because" (NEW) --> reveals date picker inline
  |
  +-- Gift Message (Optional)
  |     Textarea (unchanged)
  |
  +-- IF Recurring selected:
  |     RecurringToggleSection (settings only, no toggle header)
  |       - Budget presets ($25/$50/$75/$100/Custom)
  |       - Payment method selector
  |       - Notification preferences
  |       - Auto-approve toggle
  |
  +-- CTA: "Schedule Gift" or "Schedule & Set Recurring"
```

## Cart + Checkout Behavior (Unchanged)

- Product is added to cart with `RecipientAssignment` containing `scheduledDeliveryDate` and `giftMessage`
- If recurring, an `auto_gifting_rules` record is also created (existing logic)
- Checkout calls `create-checkout-session` with delivery groups and metadata (existing logic)
- Webhook creates orders from metadata (existing logic)
- Scheduled processor handles T-7/T-3 pipeline (existing logic)

## Edge Cases Handled

- **"Just Because" + Recurring**: Creates a recurring rule with `date_type: 'just_because'` and the user-selected date. The orchestrator will trigger annually on that date.
- **Existing Rule Detection**: `hasExistingRule` check still works -- it matches on `recipient_id + date_type`
- **Standalone Mode**: Completely unchanged. The `standaloneMode` conditional paths are not modified.
- **Edit Mode**: Rule editing flow unchanged -- `editingRule` population logic is not affected.

