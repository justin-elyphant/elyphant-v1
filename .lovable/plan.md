

## Fix: Hide Guest Address Form for Wishlist Purchases

### Problem
When a **guest** buys from someone's wishlist, the checkout shows both:
1. The coral-orange "Shipping to [Owner]'s address" banner (correct)
2. The inline guest address form below it (incorrect — shipping uses the owner's address, not the guest's)

This happens because `needsInlineAddressForm` only checks `!hasCompleteProfileAddress && onUpdateShippingInfo` but doesn't account for wishlist purchases where the guest's address is irrelevant.

### Solution
One-line fix in `CheckoutShippingReview.tsx`.

### What changes

**`src/components/checkout/CheckoutShippingReview.tsx`** (line 77)
- Current: `const needsInlineAddressForm = !hasCompleteProfileAddress && onUpdateShippingInfo;`
- Fixed: `const needsInlineAddressForm = !isWishlistPurchase && !hasCompleteProfileAddress && onUpdateShippingInfo;`

This ensures guests buying from a wishlist only see the owner's shipping banner and are never asked for their own address.

### What this does NOT change
- Regular guest checkout — still gets the inline address form
- Authenticated wishlist purchases — already handled correctly
- Stripe metadata, webhooks, fulfillment — untouched

### Responsive
No layout changes needed — this is purely a conditional visibility fix that applies identically on mobile, tablet, and desktop.

