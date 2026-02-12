

# Fix: Buy Now Drawer Must Send Complete Data for Stripe/Webhook/Zinc Pipeline

## Problem

The Buy Now drawer's `handlePlaceOrder` call to `create-checkout-session` is missing critical fields that the edge function requires. Specifically:

1. **`pricingBreakdown` is missing entirely** -- the edge function throws an error at line 119: `if (!pricingBreakdown) throw new Error("Pricing breakdown is required")`
2. **`cartItems` field names don't match** -- the drawer sends `title` and `image`, but the edge function and webhook expect `name` and `image_url`
3. **No `user_id` in metadata** -- the standard checkout always includes this for the webhook to create orders correctly

Without these fields, tapping "Place your order" would fail immediately with a server error, and even if it somehow got through, the webhook wouldn't have the data it needs to create the order and trigger Zinc fulfillment.

## What the Standard Checkout Sends (proven working)

```text
{
  cartItems: [{ product_id, name, price, quantity, image_url, recipientAssignment }],
  shippingInfo: { name, address_line1, city, state, zip_code, country },
  pricingBreakdown: { subtotal, shippingCost, giftingFee, giftingFeeName, giftingFeeDescription, taxAmount },
  metadata: { user_id, order_type, item_count }
}
```

## What the Buy Now Drawer Currently Sends (broken)

```text
{
  cartItems: [{ product_id, title, price, quantity, image, retailer, variationText }],
  shippingInfo: { name, address_line1, city, state, zip_code, country },
  metadata: { source, delivery_scenario }
}
```

## Changes to `BuyNowDrawer.tsx`

### 1. Fix cartItems field names
- `title` --> `name` (matches edge function expectation)
- `image` --> `image_url` (matches edge function line 173)
- Keep `retailer` and `variationText` (harmless extra fields)

### 2. Add pricingBreakdown
Use `calculateDynamicPricingBreakdown(price)` (already imported) to build:
```text
pricingBreakdown: {
  subtotal: price,
  shippingCost: 0,
  giftingFee: (price * 0.10) + 1.00,
  giftingFeeName: "Elyphant Gifting Fee",
  giftingFeeDescription: "Our Gifting Fee covers...",
  taxAmount: 0
}
```

### 3. Add user_id to metadata
Query the current user from Supabase auth and include `user_id` and `order_type` in the metadata, matching the standard checkout pattern.

## Files Changed

| File | Change |
|------|--------|
| `src/components/marketplace/product-details/BuyNowDrawer.tsx` | Fix cartItems field names, add pricingBreakdown, add user_id to metadata |

## Backend Impact

**Zero.** No edge function changes needed. This simply sends the data the existing pipeline already expects, ensuring the full Stripe --> Webhook --> Order Creation --> Zinc fulfillment chain works correctly.

