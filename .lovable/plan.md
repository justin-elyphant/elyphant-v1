

# Buy Now: Amazon-Style Instant Purchase Bottom Sheet

## Overview

When a user taps "Buy Now" on mobile/tablet and has a saved address + payment method on file, show an Amazon-style **bottom drawer** (using existing Vaul `Drawer` component) confirming the order details. One tap on "Place your order" triggers the `create-checkout-session` edge function directly and redirects to Stripe. On desktop, navigate straight to `/checkout`.

If the user has no saved address or payment method, all devices fall back to the standard `/checkout` navigation.

**Zero backend changes.** The `create-checkout-session` edge function already accepts cart items, shipping info, and metadata -- we just call it from the product page instead of the checkout page.

## What Changes

### 1. New Component: `src/components/marketplace/product-details/BuyNowDrawer.tsx`

A bottom drawer (Vaul) that mirrors the Amazon screenshot:

```text
+----------------------------------+
|  [Product Image]  Product Name   |  X
|  Ships from Elyphant             |
+----------------------------------+
|  Ship to    Justin M., 309 N...  |
|  Pay with   Visa 5224            |
|  Total      $21.74               |
+----------------------------------+
|  [ Place your order ]            |  (red CTA button)
+----------------------------------+
```

**Data sources (existing hooks, no new queries):**
- `useDefaultAddress()` -- fetches user's default/first saved address
- `payment_methods` table query -- fetches default saved card (same pattern as `SavedPaymentMethodsSection`)
- Product info passed as props

**Behavior:**
- Shows loading skeleton while fetching address + payment method
- If either is missing, shows a "Complete your profile" message with a link to settings, OR falls back to regular checkout
- "Place your order" button calls `create-checkout-session` edge function directly with the product as a single cart item + saved shipping info, then redirects to the Stripe checkout URL
- Includes a small "Change" link next to address and payment method rows that navigates to `/checkout` for the full form experience

### 2. Modified: `src/components/marketplace/product-details/ProductDetailsSidebar.tsx`

**Changes:**
- Add `Zap` to lucide imports
- Add state: `showBuyNowDrawer` (boolean)
- Add Buy Now button as Position 0 in the CTA stack (red accent, `bg-red-600`)
- On click:
  - Validate variations (existing logic)
  - If `isMobile` (viewport under 1024px) AND user is authenticated: open `BuyNowDrawer`
  - If desktop OR not authenticated: use existing `handleBuyNow()` (add to cart + navigate to `/checkout`)

**New CTA hierarchy (4 buttons):**

| Position | Button | Style | Action |
|----------|--------|-------|--------|
| 0 (NEW) | Buy Now | Red filled, Zap icon | Bottom sheet (mobile) or checkout (desktop) |
| 1 | Save to Wishlist | Black filled | Wishlist popover |
| 2 | Schedule as Gift | Grey outline | Gift scheduling modal |
| 3 | Add to Cart | Subtle outline | Add to cart toast |

### 3. New Hook: `src/hooks/useDefaultPaymentMethod.ts`

Small hook (similar pattern to `useDefaultAddress`) that:
- Queries `payment_methods` table for the authenticated user
- Returns the default method (or first available)
- Returns `{ defaultPaymentMethod, loading }` 

This keeps the drawer component clean and the logic reusable.

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/components/marketplace/product-details/BuyNowDrawer.tsx` | NEW | Amazon-style bottom drawer with order summary |
| `src/hooks/useDefaultPaymentMethod.ts` | NEW | Hook to fetch user's default saved card |
| `src/components/marketplace/product-details/ProductDetailsSidebar.tsx` | EDIT | Add Buy Now button + drawer trigger logic |

## Backend Impact

**Zero.** Reuses `create-checkout-session` edge function as-is. The drawer calls it with the same payload shape the checkout page uses. All webhooks, order processing, and fulfillment pipelines remain untouched.

## Edge Cases

- **No saved address**: Drawer shows "Add a shipping address" prompt with link to settings; alternatively falls back to full checkout
- **No saved payment method**: Same pattern -- prompts user to add one or falls back to checkout
- **Expired card**: Stripe will reject at checkout session level (existing error handling)
- **Variation not selected**: Buy Now button validates variations before opening drawer (existing validation)
- **Guest user**: Falls back to regular checkout navigation (no saved data to show)
- **Popup blockers (iOS Capacitor)**: The existing manual fallback UI (`CheckoutErrorBoundary`) handles cases where Stripe redirect is blocked

## iOS Capacitor Compliance

The `BuyNowDrawer` will follow established patterns:
- 44px minimum touch targets on all interactive elements
- `triggerHapticFeedback('light')` on drawer open and "Place your order" tap
- Safe area padding (`pb-safe`) in drawer footer
- `text-base` (16px) on all text inputs to prevent iOS zoom
