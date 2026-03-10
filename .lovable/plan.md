

## Problem

Two separate markups are being applied to vendor products:

1. **At sync time** (`useSyncShopifyToProducts.ts`): A hardcoded 30% markup is baked into the `price` field before storing in the database
2. **At checkout** (`transparentPricing.ts`): The Elyphant Gifting Fee (10% + $1 Zinc fee from `pricing_settings`) is added on top

This results in double-charging shoppers. The 30% platform fee should be applied once, at checkout, through the existing transparent pricing system -- not baked into the stored product price.

Additionally, the "Default Markup" dropdown in `ProductSettingsCard.tsx` gives vendors the impression they can control pricing, which conflicts with your automated pass-through model.

## Changes

### 1. Remove "Default Markup" from vendor settings card
**File:** `src/components/vendor/products/ProductSettingsCard.tsx`

Remove the entire "Default Markup" section (the select dropdown and its description). Keep the "Default Fulfillment" selector and "Advanced Settings" button -- those are useful.

### 2. Store base price at sync time (not marked-up price)
**File:** `src/hooks/vendor/useSyncShopifyToProducts.ts`

Change the sync to store the vendor's actual retail price as `price` instead of the marked-up price. Remove the `markup` variable and `markedUpPrice` calculation. The `base_price` metadata field becomes redundant since `price` will now be the base price.

### 3. Align pricing_settings with the 30% gifting fee
**No code change needed** -- but worth noting: the `pricing_settings` table currently has `markup_percentage` at 10% (with a $1 Zinc fee). If you want the checkout gifting fee to be the full 30%, that's a database row update in Trunkline admin, not a code change. The transparent pricing system will automatically apply whatever percentage is configured there.

## Summary

| File | Change |
|------|--------|
| `ProductSettingsCard.tsx` | Remove "Default Markup" dropdown |
| `useSyncShopifyToProducts.ts` | Store base price, remove 30% markup at sync |

After this, the vendor's retail price flows through cleanly, and the Elyphant Gifting Fee is applied exactly once at checkout -- fully controlled by the platform, not the vendor.

