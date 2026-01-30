

# Minimal Plan: Fix Recurring Gift Gaps by Reusing Existing Code

## Overview

This plan fixes the three critical gaps for the Father's Day + Recurring flow using **existing proven code** rather than building new systems. Total changes: ~40 lines across 3 files.

---

## Changes Summary

| File | Change | Lines Modified |
|------|--------|----------------|
| `supabase/functions/shared/holidayDates.ts` | **NEW**: Copy from `src/constants/holidayDates.ts` | Copy existing file |
| `supabase/functions/auto-gift-orchestrator/index.ts` | Import shared holiday logic, add `get-products` fallback | ~15 lines |
| `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` | Fetch default payment method on open | ~8 lines |

---

## Change 1: Share Holiday Logic (Eliminate Hardcoded Dates)

**Problem**: Orchestrator has hardcoded holiday dates that will drift (Father's Day 2025 = June 15, not June 16).

**Solution**: Copy the proven `holidayDates.ts` to `supabase/functions/shared/` and import it.

**File**: `supabase/functions/shared/holidayDates.ts`

This is a direct copy of `src/constants/holidayDates.ts` (lines 1-121), adapted for Deno:
- Same `HOLIDAY_DATES` config with floating holiday logic
- Same `calculateHolidayDate()` with proper nth-weekday calculation
- Same `calculateNextBirthday()` for DOB handling

The orchestrator already has duplicate logic (lines 59-77) that can be replaced with an import.

---

## Change 2: Add get-products Fallback in Orchestrator

**Problem**: If wishlist is empty, orchestrator throws "No suitable gift found" and fails.

**Solution**: Call existing `get-products` edge function as fallback using rule's `gift_selection_criteria`.

**File**: `supabase/functions/auto-gift-orchestrator/index.ts`

**Current Logic (lines 246-270)**:
```typescript
// Only checks wishlist - fails if empty
if (!giftItem) {
  throw new Error('No suitable gift found within budget');
}
```

**New Logic**:
```typescript
// Step 1: Try wishlist (existing code - unchanged)
// ... existing wishlist query ...

// Step 2: If no wishlist item, use get-products with preferences
if (!giftItem && rule.gift_selection_criteria) {
  console.log('🔍 No wishlist item found, falling back to get-products search');
  
  const searchQuery = rule.gift_selection_criteria.preferred_brands?.[0] 
    || rule.gift_selection_criteria.categories?.[0] 
    || 'gift';
  
  const { data: searchResult } = await supabase.functions.invoke('get-products', {
    body: {
      query: searchQuery,
      limit: 5,
      filters: {
        maxPrice: rule.budget_limit || 100
      }
    }
  });
  
  const products = searchResult?.results || searchResult?.products || [];
  if (products.length > 0) {
    // Pick random from top 5 for variety
    const randomIndex = Math.floor(Math.random() * Math.min(5, products.length));
    const product = products[randomIndex];
    giftItem = {
      product_id: product.product_id || product.asin,
      name: product.title,
      price: product.price,
      image_url: product.image || product.main_image
    };
    console.log(`✅ Found product via search: ${giftItem.name} at $${giftItem.price}`);
  }
}

if (!giftItem) {
  throw new Error('No suitable gift found within budget');
}
```

This reuses the proven `get-products` edge function rather than building new selection logic.

---

## Change 3: Auto-Populate Default Payment Method in Modal

**Problem**: `paymentMethodId` starts empty and is only set if user explicitly selects one. Recurring rules fail at T-4 because `payment_method_id` is null.

**Solution**: On modal open, fetch user's default payment method using the existing `unifiedPaymentService.getPaymentMethods()`.

**File**: `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx`

**Add Import** (line ~23):
```typescript
import { unifiedPaymentService } from '@/services/payment/UnifiedPaymentService';
```

**Add useEffect** (after line 259, inside the existing `useEffect` for modal open):
```typescript
// Auto-populate default payment method for recurring rules
if (user) {
  unifiedPaymentService.getPaymentMethods().then(methods => {
    const defaultMethod = methods.find(m => m.is_default);
    if (defaultMethod) {
      setPaymentMethodId(defaultMethod.id);
      console.log('[Schedule Modal] Auto-set default payment method:', defaultMethod.id);
    }
  }).catch(err => console.warn('Could not fetch payment methods:', err));
}
```

This ensures when a user enables the recurring toggle, their default card is already attached.

---

## Technical Details

### What We're Reusing (Zero New Logic)

| Component | Already Proven | Location |
|-----------|----------------|----------|
| Holiday calculation | ✅ Used in frontend for 6+ months | `src/constants/holidayDates.ts` |
| Product search | ✅ Powers entire marketplace | `get-products` edge function |
| Payment methods | ✅ Used in checkout + settings | `unifiedPaymentService.getPaymentMethods()` |
| Checkout flow | ✅ Production-proven | `create-checkout-session` |

### What We're NOT Building (Avoided Over-Engineering)

- ❌ New `nicole-gift-selector` edge function
- ❌ Complex 4-tier selection algorithm backend port
- ❌ New database tables or columns
- ❌ New cron jobs or background workers

---

## Deployment Order

1. Create `supabase/functions/shared/holidayDates.ts` (copy from frontend)
2. Update `auto-gift-orchestrator/index.ts` (import shared + add fallback)
3. Deploy `auto-gift-orchestrator`
4. Update `UnifiedGiftSchedulingModal.tsx` (add payment fetch)

---

## Testing

After deployment, test the Father's Day + Recurring flow:

1. Open scheduling modal
2. Select a recipient
3. Choose "Father's Day" from presets
4. Enable recurring toggle
5. Verify payment method auto-populates (check console log)
6. Complete checkout
7. Verify `auto_gifting_rules` record has `payment_method_id` set

To test the get-products fallback (if needed later):
1. Create a rule for a recipient with empty wishlist
2. Simulate T-4 using orchestrator's `simulatedDate` parameter
3. Verify it falls back to product search instead of throwing error

