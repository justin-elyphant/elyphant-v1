

## Make Guest Email Mandatory + Guest-to-User Conversion Loop

### What We're Solving

Right now the "Your Email" field on the guest checkout (shown in your screenshot) has an `html required` attribute but no real-time validation feedback — a guest can click "Pay Now" and only gets a toast error. More importantly, **after the purchase there's zero attempt to convert that guest into a signed-up user**, which is a missed viral loop opportunity.

### The Opportunity

This is a classic e-commerce conversion funnel:

1. **Recipient shares wishlist** (viral trigger)
2. **Guest shopper lands on checkout** (high intent)
3. **We capture their email** (lead capture -- currently weak)
4. **Post-purchase, we offer account creation** (conversion moment -- currently missing)

Every major gifting platform (Zola, Amazon Registry, Target Registry) does this. The shopper just proved purchase intent -- that's the highest-conversion moment to offer an account.

### Plan

#### Part 1: Make Email Truly Mandatory with Inline Validation

**File: `src/components/checkout/UnifiedCheckoutForm.tsx`**

- Add email validation state (`guestEmailError`) that checks for valid email format on blur and on submit
- Show inline red error text below the email field when invalid (not just a toast)
- Disable the "Pay Now" / "Proceed to Payment" buttons when email is empty or invalid for guest users
- Add a subtle value proposition below the email field: "We'll send your order confirmation, tracking details, and a special offer to join Elyphant"

#### Part 2: Post-Purchase Signup Prompt on PaymentSuccess

**File: `src/pages/PaymentSuccess.tsx`**

After the "Payment Successful!" confirmation, add a conversion card for guest users:

- Detect guest status (no authenticated user in context)
- Show a card: "You're almost an Elyphant! Create a free account to track your order, save wishlists, and get personalized gift recommendations"
- Pre-fill the email from the checkout session (pass via URL param `guest_email` from the Stripe success URL)
- Two CTAs: "Create Free Account" (primary, red) and "Maybe Later" (ghost)
- "Create Free Account" calls `supabase.auth.signUp()` with the captured email, prompts for a password
- Track conversion with a console log for now (analytics later)

#### Part 3: Post-Purchase Signup on OrderConfirmation

**File: `src/pages/OrderConfirmation.tsx`**

- Same pattern: if no authenticated user, show a signup prompt card between the order details and the action buttons
- This catches guests who land here via the email confirmation link
- Messaging: "Want to track this order and future gifts? Create your free Elyphant account"

#### Part 4: Pass Guest Email Through Stripe Flow

**File: `supabase/functions/create-checkout-session/index.ts`**

- Append `guest_email` as a query parameter on the `success_url` so the PaymentSuccess page can pre-fill the signup form
- Example: `success_url: \`$\{origin\}/payment-success?session_id={CHECKOUT_SESSION_ID}&guest_email=$\{encodeURIComponent(guestEmail)\}\``

### Bonus: Also Fix a Missed formatPrice

**File: `src/components/checkout/UnifiedCheckoutForm.tsx` line 758**

The sticky bottom bar still uses raw `$${totalAmount.toFixed(2)}` -- this should be `formatPrice(totalAmount)` per the consolidation we just completed.

**File: `src/pages/OrderConfirmation.tsx` line 599**

Uses `$${(item.unit_price || item.price || 0).toFixed(2)}` -- should also use `formatPrice()`.

### Technical Details

**New component:** `GuestSignupCard` -- a reusable card component used on both PaymentSuccess and OrderConfirmation pages. Contains:
- Email display (pre-filled, read-only)
- Password input field
- "Create Free Account" button calling `supabase.auth.signUp()`
- Success state that shows "Account created! Check your email to verify"
- Error handling for existing accounts ("Already have an account? Sign in instead")

**Files changed:**
- `src/components/checkout/UnifiedCheckoutForm.tsx` -- email validation + formatPrice fix
- `src/pages/PaymentSuccess.tsx` -- guest signup card
- `src/pages/OrderConfirmation.tsx` -- guest signup card + formatPrice fix
- `src/components/checkout/GuestSignupCard.tsx` -- new reusable component
- `supabase/functions/create-checkout-session/index.ts` -- pass guest_email in success URL

**No database changes needed** -- uses existing `auth.users` and `profiles` table with the existing auto-creation trigger.

