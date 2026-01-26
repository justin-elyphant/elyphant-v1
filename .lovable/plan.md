
# Unify Cart Recipient Selection with SimpleRecipientSelector Pattern

## Problem Statement

The Cart page's "Select Recipient" modal (`UnifiedRecipientSelection.tsx` - 880 lines) has a different look and feel compared to the new `SimpleRecipientSelector` (429 lines) used in the `UnifiedGiftSchedulingModal`. This creates visual inconsistency across the app.

### Current State (Cart Modal - from your screenshot)

| Aspect | Cart Modal (UnifiedRecipientSelection) |
|--------|---------------------------------------|
| **Layout** | Full modal overlay with fixed positioning |
| **Connection Display** | Card-style rows with large avatars (40px) |
| **Grouping** | Grouped by source: "Pending Invitations" → "Connected Friends" |
| **Search** | Top of list, separate from options |
| **Add New** | Bottom button "Add New Recipient" → Full inline form |
| **Touch Targets** | Variable, some smaller than 44px |
| **Haptic Feedback** | None |
| **Styling** | Cards with colored borders (orange for pending) |

### Target State (SimpleRecipientSelector Pattern)

| Aspect | SimpleRecipientSelector |
|--------|------------------------|
| **Layout** | Inline expandable (Radix Collapsible) |
| **Connection Display** | Compact list rows with smaller avatars (32px) |
| **Grouping** | "Top 3 Connections" first, pending only shown when searching |
| **Search** | Below "Ship to Myself", acts as gateway to more |
| **Add New** | Top of list "Invite New Recipient" with gradient icon |
| **Touch Targets** | Consistent 44px minimum (iOS Capacitor compliant) |
| **Haptic Feedback** | Yes (`triggerHapticFeedback('light')` on selection) |
| **Styling** | Monochromatic with subtle purple gradient accent |

---

## Recommended Approach: Migrate UnifiedRecipientSelection to Use SimpleRecipientSelector

Rather than maintaining two different UIs, refactor `UnifiedRecipientSelection` to wrap `SimpleRecipientSelector` while preserving its modal container and "Add New Recipient" inline form functionality.

### Architecture Option

**Option A: Thin Modal Wrapper** (Recommended)
- Keep `UnifiedRecipientSelection` as a thin Dialog wrapper
- Replace the 600+ lines of recipient list UI with `SimpleRecipientSelector`
- Preserve the "Add New Recipient" form (unique to cart flow)
- Result: ~200-250 lines (down from 880)

**Option B: Full Replacement**
- Delete `UnifiedRecipientSelection` entirely
- Use `SimpleRecipientSelector` directly everywhere
- Move "Add New Recipient" form to a separate modal
- Result: Simpler but requires more refactoring of cart integration points

---

## Implementation Plan (Option A - Thin Wrapper)

### Phase 1: Refactor UnifiedRecipientSelection.tsx

1. **Remove duplicate recipient list UI** (lines 504-656)
   - Delete the custom card-based recipient rendering
   - Delete the grouped recipients logic (`groupedRecipients`, `getSourceIcon`, `getSourceLabel`)
   - Delete the user search results section

2. **Import and integrate SimpleRecipientSelector**
   - Add import for `SimpleRecipientSelector, { SelectedRecipient }`
   - Render SimpleRecipientSelector in the modal content area
   - Wire up `onChange` handler to convert `SelectedRecipient` → `UnifiedRecipient`

3. **Keep the "Add New Recipient" form**
   - The inline form (lines 657-879) is unique to the cart flow
   - Preserve this as a separate state (`showNewRecipientForm`)
   - Style the form to match SimpleRecipientSelector aesthetics

4. **Simplify modal structure**
   - Use Radix Dialog instead of custom fixed overlay
   - Apply consistent styling with other modals

### Phase 2: Type Alignment

Create adapter to convert between:
```typescript
// SimpleRecipientSelector output
SelectedRecipient {
  type: 'self' | 'connection' | 'later';
  connectionId?: string;
  connectionName?: string;
  shippingAddress?: {...};
}

// Cart's expected format
UnifiedRecipient {
  id: string;
  name: string;
  email?: string;
  source: 'connection' | 'pending' | 'address_book';
  relationship_type?: string;
  status?: string;
  address?: {...};
}
```

### Phase 3: Visual Alignment

Apply SimpleRecipientSelector's design patterns to the remaining form UI:
- 44px minimum touch targets
- Haptic feedback on interactions
- Gradient accent on primary CTAs
- Monochromatic foundation

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/cart/UnifiedRecipientSelection.tsx` | Major refactor - wrap SimpleRecipientSelector |

## Files Unchanged

| File | Reason |
|------|--------|
| `src/components/marketplace/product-details/SimpleRecipientSelector.tsx` | Already the target pattern |
| `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` | Already uses SimpleRecipientSelector |

---

## Estimated Reduction

| Metric | Before | After |
|--------|--------|-------|
| UnifiedRecipientSelection.tsx | 880 lines | ~200-250 lines |
| Duplicate recipient list UI | Yes | No |
| iOS Capacitor compliance | Partial | Full |
| Visual consistency | Inconsistent | Unified |

---

## Technical Considerations

1. **"Invite New Recipient" flow uniqueness**: The cart's inline form includes Google Places autocomplete and relationship selector. This should be preserved but restyled.

2. **Universal user search**: `UnifiedRecipientSelection` has a feature to search all Elyphant users (not just connections) and create pending invitations. This could be added to `SimpleRecipientSelector` as a future enhancement, OR kept as a cart-specific feature in the form.

3. **onRecipientSelect callback**: The cart expects `UnifiedRecipient` type. An adapter function will bridge the `SelectedRecipient` output from `SimpleRecipientSelector`.

---

## Testing Checklist

1. Cart page: Click "Assign to Recipient" on unassigned item
2. Verify modal opens with SimpleRecipientSelector-style UI
3. Select an existing connection - verify address flows through
4. Click "Invite New Recipient" - verify form appears with correct styling
5. Submit new recipient - verify pending invitation created
6. Test on iOS Capacitor - verify 44px touch targets and haptics
