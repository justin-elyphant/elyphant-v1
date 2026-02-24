

# Desktop Buy Now: Missing Recipient and Scheduling Options

## Problem

On desktop, the "Buy Now" button bypasses the recipient selection, gift note, and scheduling UI entirely. Here is how each flow works today:

**Mobile/Tablet (correct)**:
Buy Now click opens a `BuyNowDrawer` with 4 collapsible sections:
1. Recipient Selection
2. Gift Note
3. Schedule Delivery
4. Payment

**Desktop (broken)**:
Buy Now click calls `handleBuyNow()` which simply adds item to cart and navigates to `/checkout` with no opportunity to select a recipient, write a gift note, or schedule delivery.

The `/cart` page does have "Send as a gift instead" and inline recipient assignment, but the desktop Buy Now flow skips the cart entirely.

## Proposed Solution

Open the **same BuyNowDrawer on desktop** that already works on mobile/tablet. The drawer is already a well-tested component with all 4 steps built in. The only reason it is skipped on desktop is a viewport check in `ProductDetailsSidebar.tsx`:

```text
// Line 155: Only opens drawer on small screens
if (!isLargeScreen && user) {
  setShowBuyNowDrawer(true);
} else {
  handleBuyNow(); // Desktop: just adds to cart and navigates
}
```

## Implementation Steps

### 1. Remove the viewport gate in ProductDetailsSidebar.tsx

Change the `handleBuyNowClick` function so that authenticated users on ALL screen sizes open the BuyNowDrawer. Only guests fall through to the sign-up/checkout redirect.

Before:
```text
if (!isLargeScreen && user) {
  setShowBuyNowDrawer(true);
} else {
  handleBuyNow();
}
```

After:
```text
if (user) {
  triggerHapticFeedback("light");
  setShowBuyNowDrawer(true);
} else {
  handleBuyNow(); // Guest: add to cart + navigate to checkout
}
```

### 2. Constrain the BuyNowDrawer width on desktop

The drawer is currently designed for mobile bottom-sheet presentation. On desktop it should render as a centered dialog or constrained-width drawer. Add a `sm:max-w-lg sm:mx-auto` constraint (consistent with the existing drawer desktop constraint pattern documented in project memory).

### 3. Verify the BuyNowDrawer renders correctly on large screens

The drawer uses `Drawer` from vaul. It should render properly at desktop widths with the max-width constraint. No logic changes needed inside the drawer -- it already handles recipient selection, gift notes, scheduling, and payment for all flows.

## What This Does NOT Change

- The `/cart` page remains unchanged -- its "Send as a gift instead" flow continues to work independently
- The mobile/tablet flow is unchanged (already uses the drawer)
- Guest users still get redirected to sign-up/checkout (no drawer for unauthenticated users)
- No backend or edge function changes needed

## Technical Details

Files modified:
- `src/components/marketplace/product-details/ProductDetailsSidebar.tsx` -- Remove `!isLargeScreen` check (lines 154-161)
- `src/components/marketplace/product-details/BuyNowDrawer.tsx` -- Add desktop width constraint if not already present

Estimated scope: 2 files, ~5 lines changed.

