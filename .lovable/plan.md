
## Unified Pricing Architecture: Consolidation Plan

### Why This Is Safe for Zinc

The payment/fulfillment pipeline already follows the Unified Pricing Standard end-to-end:

```text
Frontend (dollars)
  --> create-checkout-session (dollars * 100 = cents for Stripe)
    --> stripe-webhook-v2 (cents / 100 = dollars for DB storage)
      --> process-order-v2 (dollars * 100 = cents for Zinc max_price)
```

This plan touches **only the display layer and wishlist write path** -- neither feeds into the Zinc pipeline. Zero risk to order processing.

---

### Phase 1: Write-Path Normalization (1 file)

**File:** `src/components/gifting/wishlist/WishlistSelectionPopoverButton.tsx`

- Before saving `product.price` to `wishlist_items`, detect if it's in cents (integer > 200) and divide by 100
- This prevents bad data from entering the database, eliminating bugs at the source

---

### Phase 2: Delete Redundant Utility Files (3 files)

Delete these files whose logic is duplicated in `formatPrice()` inside `src/lib/utils.ts`:

- `src/utils/productPricing.ts` -- `formatProductPrice()`, `usesCentsPricing()` (duplicates `formatPrice`)
- `src/utils/productSourceDetection.ts` -- `formatPriceWithDetection()` (duplicates `formatPrice`)
- `src/utils/priceValidation.ts` -- `safeFormatPrice()` (thin wrapper around `formatPrice`)

**Keep** `src/utils/orderPricingUtils.ts` and `src/utils/transparentPricing.ts` -- these are domain-specific (checkout breakdown, order history) and do not overlap with display formatting.

---

### Phase 3: Update Imports (estimate 3-5 files)

Any component currently importing from the deleted files gets updated to `import { formatPrice } from "@/lib/utils"`.

---

### Phase 4: Replace Raw `.toFixed(2)` -- Customer-Facing (12 files)

Replace every `$${price.toFixed(2)}` with `formatPrice(price)`:

| File | Context |
|------|---------|
| `InlineWishlistViewer.tsx` | Wishlist item prices (the active bug) |
| `WishlistOwnerHero.tsx` | Wishlist total |
| `useFavorites.tsx` | Favorites price |
| `WishlistAdd.tsx` | Add-to-wishlist confirmation |
| `SuggestionProductCard.tsx` | AI suggestion cards |
| `MobileProductGrid.tsx` | Mobile product grid |
| `MobileProductSheet.tsx` | Mobile cart button |
| `RecommendationCard.tsx` | Recommendation cards |
| `BulkGiftingModal.tsx` | Bulk gifting total |
| `GroupGiftProjectCard.tsx` | Group gift progress |
| `StripePaymentForm.tsx` | Checkout pay button |
| `TransparentPriceBreakdown.tsx` | Price breakdown |

---

### Phase 5: Replace Raw `.toFixed(2)` -- Admin/Internal (6 files)

| File | Context |
|------|---------|
| `OverviewTab.tsx` | Revenue and GMV figures |
| `OrdersTable.tsx` | Order amounts |
| `ZincCreditsTab.tsx` | Credit amounts |
| `PricingControlsCard.tsx` | Pricing simulator |
| `BudgetTrackingSection.tsx` | Auto-gift budgets |
| `ZmaSecurityStatus.tsx` | Spending limits |

---

### Phase 6: Email Templates (1 file, 7 instances)

**File:** `EmailTemplateService.ts` -- replace all `$${price.toFixed(2)}` with `formatPrice(price)`

---

### Phase 7: Fix Existing Bad Data (SQL)

```sql
-- Fix known inflated diapers record
UPDATE wishlist_items SET price = price / 100
WHERE price > 500 AND product_id = 'B0FDX5186F';

-- Diagnostic sweep for other inflated wishlist prices
SELECT id, name, price, product_id FROM wishlist_items WHERE price > 500;
```

---

### What Does NOT Change

- `create-checkout-session` -- already receives dollars, converts to cents for Stripe
- `stripe-webhook-v2` -- already converts Stripe cents to dollars for DB
- `process-order-v2` -- already reads dollars from DB, converts to cents for Zinc `max_price`
- `orderPricingUtils.ts` -- domain-specific checkout math, stays as-is
- `transparentPricing.ts` -- domain-specific fee breakdown, stays as-is

### Result

- **Before**: 6 pricing utility files, 20+ files with raw `.toFixed(2)`, recurring 100x bugs
- **After**: 1 canonical formatter (`formatPrice`), 2 domain modules (checkout/order math), 0 raw formatting in display code
- **Zinc pipeline**: Completely unaffected -- dollars-in-DB, cents-to-Zinc conversion untouched
