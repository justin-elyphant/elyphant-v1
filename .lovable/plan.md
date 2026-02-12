

# Add All-In Pricing to Buy Now Drawer

## Problem

The "Total" in the Buy Now drawer currently shows only the base product price. It does not include the Elyphant Gifting Fee (10% markup + $1.00 Zinc fee), shipping, or tax.

## Solution

Calculate the complete total using the existing `calculateDynamicPricingBreakdown` utility and display it with an Amazon-style "(includes fees)" note underneath.

## Change: `src/components/marketplace/product-details/BuyNowDrawer.tsx`

1. **Import** `calculateDynamicPricingBreakdown` from `@/utils/orderPricingUtils`
2. **Compute** the all-in total using `calculateDynamicPricingBreakdown(price)` which returns `grandTotal` including the 10% markup + $1.00 Zinc fee
3. **Update the Total display** (lines 198-201) from:
   ```
   Total       $22.00
   ```
   To:
   ```
   Total       $24.20
   (includes fees)
   ```
4. **Pass `grandTotal`** instead of `price` to the `create-checkout-session` call so the checkout session amount matches what the user sees

### Pricing math example (for a $22.00 product)
- Base price: $22.00
- Gifting fee: ($22.00 x 10%) + $1.00 = $3.20
- Total shown: $25.20
- Note below: "(includes fees)"

## Files Changed

| File | Change |
|------|--------|
| `BuyNowDrawer.tsx` | Import pricing util, compute all-in total, add "(includes fees)" subtitle |

## Backend Impact

**Zero.** The `create-checkout-session` edge function already handles pricing server-side. The drawer total is a display-only change to set correct expectations before the user taps "Place your order."

