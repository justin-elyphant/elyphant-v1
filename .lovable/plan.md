

# Fix: Address/Payment Taps Should Navigate to Settings, Not Checkout

## Problem

Tapping the "Ship to" or "Pay with" rows in the Buy Now drawer calls `handleChange()`, which navigates to `/checkout`. But the Buy Now flow is independent of the cart -- there are no cart items, so `/checkout` shows "Your cart is empty."

## Solution

Change the tap destination from `/checkout` to `/settings` (where users can manage addresses and payment methods). This is consistent with the "Go to Settings" button already shown when no address/payment is saved (line 237).

## Change: `src/components/marketplace/product-details/BuyNowDrawer.tsx`

**Line 126-129** -- rename `handleChange` to `handleGoToSettings` and navigate to `/settings` instead of `/checkout`:

```ts
const handleGoToSettings = () => {
  onOpenChange(false);
  navigate("/settings");
};
```

**Lines 186 and 201** -- update both `onClick` handlers from `handleChange` to `handleGoToSettings`.

## Files Changed

| File | Change |
|------|--------|
| `BuyNowDrawer.tsx` | Change address/payment tap handler to navigate to `/settings` instead of `/checkout` |

## Technical Details

- The `handleChange` function on line 126 currently does `navigate("/checkout")` which is incorrect for the Buy Now flow
- Both the "Ship to" button (line 186) and "Pay with" button (line 201) use this same handler
- The fix simply redirects to `/settings` where address and payment management already exists
- No cart clearing, no side effects -- just a destination change

