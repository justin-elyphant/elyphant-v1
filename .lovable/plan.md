

## Fix: Guest Cart "Add Shipping Address" Dead End on Desktop

### Problem

Two issues on the `/cart` page:

1. **Desktop sidebar** — The "Proceed to Checkout" button uses `disabled={!hasCompleteAddress}`. For guests, `profile` is null, so `hasCompleteAddress` is always false. The button shows "Add Shipping Address" but has no form and no link — it's a dead end. This is the screenshot you're seeing.

2. **Mobile sticky bar** — Already has correct guest logic (`!isWishlistPurchase && user ? !hasCompleteAddress : false`), so guests CAN proceed on mobile. Desktop and mobile are inconsistent.

The "Send to Someone New" manual address flow is separate — it works via the recipient assignment modal ("Assign" button), which is correctly wired. The issue here is specifically about **self-purchase shipping for guests** on the cart page's desktop CTA.

### What changes

**`src/pages/Cart.tsx`** — 3 edits:

1. **Desktop sidebar button** (line ~641): Match the mobile logic — guests bypass the `hasCompleteAddress` check since they'll enter their address inline at `/checkout`
   - Change: `disabled={!hasCompleteAddress}` → `disabled={!isWishlistPurchase && user ? !hasCompleteAddress : false}`
   - Change button label: show "Proceed to Checkout" for guests instead of "Add Shipping Address"

2. **`hasCompleteAddress` derivation** (line ~264): For guests (`!user`), treat as true so the Order Summary section doesn't show misleading states
   - Change: `const hasCompleteAddress = isWishlistPurchase || !user || (shippingAddress && ...)`

3. **`handleCheckout` guard** (line ~61): Already scoped to `if (user && ...)` so guests pass through — no change needed, just confirming

### What this does NOT change
- The `/checkout` page inline address form (already working for guests)
- The "Assign" → "Send to Someone New" manual address flow (already working)
- Authenticated user experience (still requires saved address for self-purchase)
- Stripe webhook or fulfillment pipeline — untouched

### Files touched
| File | Change |
|------|--------|
| `src/pages/Cart.tsx` | Fix desktop CTA disabled state + label for guests |

