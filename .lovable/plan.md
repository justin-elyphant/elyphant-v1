

## Hide "Assign" Button for Guest Users on /cart

### Problem
Guest users see "No recipient assigned" + an "Assign" button on each cart item. This is confusing because guests can't manage recipients — their shipping address is collected inline at checkout.

### Fix
In `src/pages/Cart.tsx` around line 567-581, wrap the "No recipient assigned" + Assign button block in a `user` check. For guests, show nothing (or optionally a subtle "Address collected at checkout" note).

### Change

**`src/pages/Cart.tsx`** (~line 567-581)
- Current: Always shows "No recipient assigned" + Assign button when no recipient is set
- New: Only show this block when `user` is truthy (authenticated). For guests (`!user`), either hide entirely or show a small muted note like "Shipping address collected at checkout"

### What stays unchanged
- Authenticated users still see Assign button as before
- Wishlist gift items still show their own UI
- Checkout inline address form for guests — untouched
- All other cart functionality — untouched

