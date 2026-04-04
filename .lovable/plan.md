

## Fix: Guest Checkout Missing Shipping Address Form

### Problem

The guest checkout at `/checkout` is a dead end. A guest sees:
1. **Red error**: "Shipping setup is incomplete. Please return to cart to configure your shipping address." — but the cart has no address form either
2. **"Your Address"** section shows "No shipping address configured" — with no way to enter one
3. The "Proceed to Payment" button is effectively blocked since there's no shipping address

This violates basic e-commerce UX — every major retailer (Amazon, Lululemon, Target) collects the shipping address **inline on the checkout page** for guests. Sending them back to the cart is a conversion killer.

### Solution

Add an **inline shipping address form** for guests (and logged-in users without a saved address) directly in `CheckoutShippingReview`. When no address exists, instead of showing an error, show a clean address entry form that saves to checkout state.

### What changes

**`src/components/checkout/CheckoutShippingReview.tsx`**
- When `!user` (guest) OR `!hasCompleteAddress`: replace the red error alert and "No shipping address configured" message with an inline address form
- Form fields: Full Name, Address Line 1, Address Line 2 (optional), City, State, ZIP Code
- On completion, call `handleUpdateShippingInfo()` to store in checkout state (not DB — guests have no profile)
- Show a green checkmark + address summary once entered, with an "Edit" button to modify

**`src/components/checkout/UnifiedCheckoutForm.tsx`**
- Pass `handleUpdateShippingInfo` down to `CheckoutShippingReview` as a prop so the inline form can update checkout state
- Remove the `hasIncompleteShipping` error condition for guests — the inline form replaces it
- Ensure `createCheckoutSession` reads the guest-entered address from checkout state

**`src/components/marketplace/checkout/useCheckoutState.tsx`**
- Verify `shippingInfo` state already supports name, address, city, state, zip fields (it likely does — just confirming the form can write to it)

### UX flow after fix

```text
Guest arrives at /checkout
  → Shipping section shows inline address form
  → Guest fills in name + address
  → Form validates inline (required fields, ZIP format)
  → Address summary appears with checkmark
  → Guest enters email
  → "Proceed to Payment" becomes active
  → Redirects to Stripe
```

### What this does NOT change
- Authenticated users with saved addresses — unchanged, address shows as before
- Wishlist purchase flow — unchanged, uses owner's address
- Payment processing, Stripe integration, order creation — untouched
- The "return to cart" link for authenticated users with incomplete addresses stays (they can edit in cart)

### Responsive considerations
- Form uses standard Tailwind grid: single column on mobile, city/state/zip in a row on tablet+
- Touch targets meet 44px minimum
- Consistent with existing Lululemon-minimal card styling

