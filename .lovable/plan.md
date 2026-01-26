
# Consolidated Plan: Recurring Gifts with AI (Rebranded & Unified)

## Summary

Consolidate the "Recurring" mode in `UnifiedGiftSchedulingModal` with the full `AutoGiftSetupFlow` wizard, and rebrand from "AI Gifting" to **"Recurring Gifts"** (with "Powered by Nicole AI" badge). This maximizes component reuse and eliminates duplicate pathways.

---

## Phase 1: Embed AutoGiftSetupFlow in UnifiedGiftSchedulingModal

### What We're Reusing (NOT Rebuilding)
- `AutoGiftSetupFlow` (951 lines) - already has multi-step wizard, validation, batch rule creation
- `SimpleRecipientSelector` - already in modal, just pass to embedded flow
- `ExistingRulesDialog` - already built for rule collision detection
- `MultiEventSelector` - already in AutoGiftSetupFlow for multiple occasions
- `HolidaySelector` - shared between both
- `UnifiedPaymentMethodManager` - shared between both

### Changes to UnifiedGiftSchedulingModal.tsx

**DELETE** (duplicate logic):
- Lines 309-377: `handleRecurringSetup()` function (~68 lines)
- Lines 487-531: Inline recurring UI (HolidaySelector, budget slider, payment method) (~44 lines)

**ADD**:
```tsx
// Import
import AutoGiftSetupFlow from '@/components/gifting/auto-gift/AutoGiftSetupFlow';

// In mode === 'recurring' section, replace inline form with:
<AutoGiftSetupFlow
  open={true}  // Always open when embedded
  onOpenChange={(open) => !open && onOpenChange(false)}
  embedded={true}
  initialRecipient={selectedRecipient}  // Pre-fill from SimpleRecipientSelector
  onComplete={() => {
    onComplete?.({ mode: 'recurring', ... });
    onOpenChange(false);
  }}
/>
```

**Estimated change**: -112 lines, +15 lines = **~97 lines removed**

---

## Phase 2: Add Embedded Mode to AutoGiftSetupFlow

### Changes to AutoGiftSetupFlow.tsx

**ADD new props**:
```tsx
interface AutoGiftSetupFlowProps {
  // ... existing props
  embedded?: boolean;  // Skip Dialog wrapper
  initialRecipient?: SelectedRecipient;  // Pre-selected from parent
  onComplete?: () => void;  // Callback instead of onOpenChange
}
```

**MODIFY rendering**:
```tsx
// When embedded={true}:
// 1. Don't render <Dialog> wrapper - return content directly
// 2. Skip Step 1 (recipient) if initialRecipient provided - start at Step 2
// 3. Call onComplete() instead of onOpenChange(false) on success
```

**REPLACE** `RecipientSearchCombobox` with `SimpleRecipientSelector`:
- Lines 574-616: Replace combobox with same selector used in modal
- This ensures visual consistency between embedded and standalone modes

**Estimated change**: +30 lines for new props/logic, -40 lines by removing combobox wrapper = **~10 lines removed**

---

## Phase 3: Rebrand "AI Gifting" → "Recurring Gifts"

### Files to Update

| File | Change |
|------|--------|
| `src/App.tsx:223` | Route stays `/recurring-gifts` (new) |
| `src/App.tsx:241-242` | Add redirect: `/ai-gifting` → `/recurring-gifts` |
| `src/components/navigation/DesktopHorizontalNav.tsx:19` | Label: "Recurring Gifts" |
| `src/components/navigation/MobileBottomNavigation.tsx:32` | Label: "Recurring Gifts" |
| `src/components/layout/AppSidebar.tsx:72` | Label: "Recurring Gifts" |
| `src/components/layout/navigation/navigationData.tsx:8` | Label: "Recurring Gifts" |
| `src/pages/AIGifting.tsx:73` | Title: "Recurring Gifts" + "Powered by Nicole AI" badge |

### Page Simplification (AIGifting.tsx → RecurringGifts.tsx)

**KEEP**:
- Lines 60-162: Hero section (rebrand text)
- Lines 220-228: `ActiveRulesSection` (management table)
- Lines 310-328: `RuleApprovalDialog` (email link approvals)

**REMOVE** (setup now happens in modal):
- Lines 79-91: "Schedule Your First Gift" button opening `AutoGiftSetupFlow`
- Lines 280-309: `AutoGiftSetupFlow` standalone Dialog instance

**MODIFY**:
- Hero CTA → "Browse Products" (navigate to `/marketplace`)
- Badge: "SMART AUTOMATION" → "POWERED BY NICOLE AI"
- Title: "AI Gifting" → "Recurring Gifts"
- Description: Update copy to focus on "set and forget" recurring

**Estimated change**: -30 lines (remove setup dialog), minor text updates

---

## Phase 4: Update Supporting Components

### Minor Text Updates Only (No Logic Changes)

| Component | Change |
|-----------|--------|
| `AutoGiftStatusBadge.tsx:21` | "AI Gifting Ready" → "Recurring Gifts Active" |
| `AutoGiftToggle.tsx:32` | "AI Gifting with {name}" → "Recurring Gifts for {name}" |
| `QuickGiftCTA.tsx:24-33` | "AI Gift Autopilot" → "Recurring Gift Autopilot" |
| `ExistingRulesDialog.tsx:37` | "AI Gifting for {name}" → "Recurring Gifts for {name}" |
| `HowItWorksModal.tsx` | Update any "AI Gifting" text |

---

## Component Reuse Summary

| Component | Status | Notes |
|-----------|--------|-------|
| `SimpleRecipientSelector` | ✅ Reuse | Already in modal, will replace combobox in flow |
| `HolidaySelector` | ✅ Reuse | Shared component, no changes |
| `MultiEventSelector` | ✅ Reuse | Already in AutoGiftSetupFlow |
| `UnifiedPaymentMethodManager` | ✅ Reuse | Shared component, no changes |
| `ExistingRulesDialog` | ✅ Reuse | Already exists, just integrate |
| `ActiveRulesSection` | ✅ Reuse | Management table, no changes |
| `AddressVerificationWarning` | ✅ Reuse | Already in AutoGiftSetupFlow |
| `HowItWorksModal` | ✅ Reuse | Educational content, text updates only |

---

## What We're NOT Building

1. ~~New hooks for rule detection~~ → `ExistingRulesDialog` already handles this
2. ~~Multi-event UI~~ → `MultiEventSelector` already exists
3. ~~Notification config UI~~ → Already Step 3 in AutoGiftSetupFlow
4. ~~New management table~~ → `ActiveRulesSection` already exists
5. ~~Payment method selection~~ → `UnifiedPaymentMethodManager` shared

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Duplicate rule creation logic | 2 implementations | 1 (in AutoGiftSetupFlow) |
| Recipient selectors | 2 different UIs | 1 (SimpleRecipientSelector) |
| User pathways for recurring gifts | 3 (modal + page + dashboard tab) | 2 (modal entry + page management) |
| Lines in UnifiedGiftSchedulingModal | 628 | ~530 |
| Lines in AIGifting.tsx | 333 | ~300 (renamed to RecurringGifts.tsx) |

---

## Testing Checklist

1. **Product page → Schedule Gift → One-Time mode** - unchanged
2. **Product page → Schedule Gift → Recurring mode** - opens embedded AutoGiftSetupFlow
3. **Pre-selected recipient carries over** when toggling to Recurring
4. **Existing rules dialog appears** if recipient has active rules
5. **Multi-event selection works** in embedded mode
6. **/recurring-gifts page** shows management view only
7. **Navigation links** all point to `/recurring-gifts`
8. **Old /ai-gifting URLs** redirect to `/recurring-gifts`
9. **Mobile (iOS Capacitor)** - 44px targets, haptics work in embedded flow
