

## Extend "Send to Someone New" to /checkout + Responsive QA

### Current state
- `manual_address` works in the **Buy Now drawer** via `SimpleRecipientSelector`
- The **/checkout page** uses `UnifiedRecipientSelection` which still only has the old "Invite New" flow (creates a platform invitation, recipient must sign up first)
- `UnifiedRecipientSelection` already imports `SimpleRecipientSelector` (line 16) but doesn't pass through `manual_address` selections to its parent

### Plan

**Step 1 — Wire `manual_address` through `UnifiedRecipientSelection`**

In `src/components/cart/UnifiedRecipientSelection.tsx`:
- The component already renders `SimpleRecipientSelector` internally and handles its `onChange`
- Update the `onChange` handler to detect `type: 'manual_address'` and convert it to a `UnifiedRecipient` with the shipping address fields populated
- Pass the address data through to `onRecipientSelect` so the checkout page receives it

**Step 2 — Handle `manual_address` in Cart/Checkout flow**

In `src/pages/Cart.tsx` (or wherever `handleRecipientSelect` processes the selection):
- Add a branch for `manual_address` recipients so the checkout metadata includes `recipient_email`, `recipient_name`, and the manually entered shipping address
- Mirror the same metadata pattern already working in `BuyNowDrawer`

**Step 3 — Update `create-checkout-session` if needed**

Verify the edge function accepts `recipient_email` / `recipient_name` in metadata from the cart checkout path (it likely already does since metadata is passed through generically).

**Step 4 — Responsive QA for the address form**

The form inputs already use mobile-friendly sizing (`h-11 text-base`, `grid grid-cols-3`). Verify:
- On phone (< 768px): the 3-column city/state/zip grid doesn't overflow — may need `grid-cols-1` or `grid-cols-[2fr_1fr_1fr]` for narrow screens
- On tablet (768-1024px): form renders well within the drawer/dialog
- On desktop: no issues expected

### Files changed

| File | Change |
|------|--------|
| `src/components/cart/UnifiedRecipientSelection.tsx` | Handle `manual_address` from `SimpleRecipientSelector`, convert to `UnifiedRecipient` with address |
| `src/pages/Cart.tsx` | Process `manual_address` recipient in checkout metadata |
| `src/components/marketplace/product-details/SimpleRecipientSelector.tsx` | Minor responsive tweak: stack city/state/zip on very small screens |

### What this does NOT change
- Buy Now drawer flow — already working, untouched
- `stripe-webhook-v2` — already handles `recipient_email` generically
- No new components — reuses `SimpleRecipientSelector` already embedded in `UnifiedRecipientSelection`

