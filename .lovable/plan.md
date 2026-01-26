
# Checkout Legacy Code Cleanup Plan

## Summary
Delete 4 orphaned legacy components (~1,130 lines) and deprecate the checkout's `UnifiedDeliverySection` that renders broken recipient assignment UI.

---

## Audit Findings

### 1. Safe Deletions (Unused Components)

| File | Lines | Status |
|------|-------|--------|
| `src/components/checkout/EnhancedRecipientSelection.tsx` | 168 | ❌ Orphaned - not imported anywhere |
| `src/components/connections/ConnectionRecipientSelector.tsx` | 251 | ❌ Orphaned - only used by EnhancedRecipientSelection |

**Evidence**: The main checkout (`UnifiedCheckoutForm.tsx`) does NOT import either component. They are relics from a pre-unified architecture.

---

### 2. Dual RecipientAssignmentSection Problem

There are **TWO files** with the same name:

| File | Lines | Status |
|------|-------|--------|
| `src/components/cart/RecipientAssignmentSection.tsx` | 678 | ❌ Legacy - contains mock data, duplicate scheduling UI |
| `src/components/marketplace/checkout/RecipientAssignmentSection.tsx` | 31 | ❌ Stub - empty placeholder with props that are never passed |

**The Problem**:
- `UnifiedDeliverySection.tsx` imports from `src/components/cart/RecipientAssignmentSection.tsx`
- It renders `<RecipientAssignmentSection />` with **no props** (line 100)
- The cart version internally fetches its own data (not using passed props)
- It contains mock connections that display in production
- It has its own scheduling UI (lines 454-520) that conflicts with `UnifiedGiftSchedulingModal`

**Recommendation**: Both files should be deleted. The checkout flow should rely on:
1. **Cart page**: Already uses `RecipientPackagePreview` + `UnifiedGiftSchedulingModal` (working correctly)
2. **Checkout page**: Should display already-assigned recipients from CartContext (read-only summary), not provide a duplicate assignment UI

---

## Implementation Plan

### Phase 1: Delete Orphaned Checkout Components
**Files to Delete**:
```
src/components/checkout/EnhancedRecipientSelection.tsx (168 lines)
src/components/connections/ConnectionRecipientSelector.tsx (251 lines)
```

### Phase 2: Delete Legacy RecipientAssignmentSection Files
**Files to Delete**:
```
src/components/cart/RecipientAssignmentSection.tsx (678 lines)
src/components/marketplace/checkout/RecipientAssignmentSection.tsx (31 lines)
```

### Phase 3: Fix UnifiedDeliverySection
**File**: `src/components/marketplace/checkout/UnifiedDeliverySection.tsx`

**Current Broken Code (lines 91-102)**:
```tsx
{(scenario === 'gift' || scenario === 'mixed') && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        Gift Recipients
      </CardTitle>
    </CardHeader>
    <CardContent>
      <RecipientAssignmentSection />  // ← Renders broken legacy component
    </CardContent>
  </Card>
)}
```

**Replacement**: Display a read-only summary of recipients already assigned in the cart:
```tsx
{(scenario === 'gift' || scenario === 'mixed') && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        Gift Recipients
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Recipients assigned in cart will be shown here.
      </p>
      {/* Future: Map over deliveryGroups from CartContext */}
    </CardContent>
  </Card>
)}
```

---

## Technical Details

### Why This Is Safe
1. **Checkout flow already works**: The cart page handles all recipient assignment via `UnifiedRecipientSelection` and `RecipientPackagePreview`
2. **No props are passed**: The legacy component is invoked with `<RecipientAssignmentSection />` (no props), so it's already semi-broken
3. **Mock data displays in production**: The 678-line file falls back to showing "Sarah Johnson, Mike Chen..." mock users when no connections load

### What Remains After Cleanup
- **Recipient Selection**: `SimpleRecipientSelector` (inline expandable) via `UnifiedGiftSchedulingModal`
- **Cart Recipient UI**: `RecipientPackagePreview` (displays assigned packages with edit capability)
- **Cart Assignment Modal**: `UnifiedRecipientSelection` (880 lines) - keep for now, potential future migration
- **Scheduling**: `UnifiedGiftSchedulingModal` (the single standard)

---

## Impact Summary

| Metric | Before | After |
|--------|--------|-------|
| Recipient selection components | 4 overlapping | 2 unified |
| RecipientAssignmentSection files | 2 conflicting | 0 |
| Lines removed | - | ~1,128 lines |
| Mock data in checkout | Present | Eliminated |

---

## Files to Delete

```
src/components/checkout/EnhancedRecipientSelection.tsx
src/components/connections/ConnectionRecipientSelector.tsx
src/components/cart/RecipientAssignmentSection.tsx
src/components/marketplace/checkout/RecipientAssignmentSection.tsx
```

## Files to Modify

```
src/components/marketplace/checkout/UnifiedDeliverySection.tsx
```

---

## Post-Cleanup Testing

1. **Product Page**: Verify "Schedule Gift" modal opens and recipient selection works
2. **Cart Page**: Verify recipient packages display correctly with edit capability
3. **Checkout Page (gift scenario)**: Verify no crash when gift items are present
4. **Checkout Page (self scenario)**: Verify shipping form displays correctly
