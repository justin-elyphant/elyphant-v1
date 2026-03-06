

# Post-Schedule Navigation: Redirect to Cart After Scheduling a Gift

## Problem
After scheduling a gift via the "Schedule as Gift" button on a product page, the user lands back on the same product page with the "Buy Now" button still prominent. This creates confusion — shoppers may click "Buy Now" thinking they haven't completed the action, or not realize their scheduled gift is already in the cart.

## E-Commerce Best Practice
Major retailers (Amazon, Target) redirect users to the cart after adding an item, with a prominent "Continue Shopping" button. This pattern:
- Confirms the action succeeded (cart view = proof)
- Prevents accidental double-purchases
- Gives shoppers a clear fork: proceed to checkout OR keep browsing

## Changes

### 1. Auto-navigate to `/cart` after gift is scheduled
**File:** `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` (~line 740-760)

After the success toast in `handleProductSubmit`, add `navigate('/cart')` instead of just closing the modal. The toast with "View Cart" action becomes redundant since the user is already there. Replace it with a simpler confirmation toast.

### 2. Add "Continue Shopping" button to Cart page
**File:** `src/pages/Cart.tsx`

Add an `ArrowLeft` + "Continue Shopping" button near the top of the cart (next to the existing cart header). Clicking it navigates back to `/marketplace` (or uses `navigate(-1)` to return to the product they were browsing). This is standard e-commerce UX — Amazon, Target, and Lululemon all have this.

The page already imports `ArrowLeft` from lucide-react, so this is minimal work.

### 3. Keep the empty-cart state navigation
The cart page likely already has a "Start Shopping" CTA for empty carts — no change needed there.

## Files Changed
1. `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` — navigate to `/cart` after scheduling
2. `src/pages/Cart.tsx` — add "Continue Shopping" button in header area

