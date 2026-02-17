
# Guest-to-User Order Linking and Onboarding

## Problem

Two gaps exist in the guest-to-user conversion flow:

1. **Orders never get linked**: When a guest creates an account via the `GuestSignupCard`, the code only calls `supabase.auth.signUp()`. It never updates the guest orders (which have `user_id = NULL` and `guest_email = 'justin+guest@elyphant.com'`) to point to the newly created user. So the orders don't appear in "My Orders."

2. **No onboarding after guest conversion**: After creating a password, the guest is shown a "check your email" success message but is never routed through the onboarding flow (DOB, shipping address, interests, etc.) that regular signups go through.

## Solution

### 1. Add order-claiming logic after guest signup

In `GuestSignupCard.tsx`, after a successful `signUp()`, call a new function that updates all orders matching that `guest_email` to set `user_id` to the new user's ID.

This will be done via a Supabase Edge Function (`claim-guest-orders`) rather than a direct client update, because:
- The client (anon role) likely can't UPDATE orders where `user_id IS NULL`
- A server-side function can securely verify the email match and do the update

**Edge Function: `claim-guest-orders`**
- Input: user's JWT (from auth header)
- Logic: Extract user email from JWT, then `UPDATE orders SET user_id = auth.uid() WHERE guest_email = user_email AND user_id IS NULL`
- Returns: count of claimed orders

### 2. Route guest converts through onboarding

After email verification via `AuthCallback.tsx`, the user already gets redirected to `/profile-setup`. This is the correct behavior -- the guest-converted user will go through the standard onboarding flow (DOB, shipping, interests, profile image) when they verify their email.

However, the `GuestSignupCard` success state should make this clearer by:
- Mentioning that after email verification, they'll complete a quick profile setup
- Emphasizing the benefits (AI gift recommendations, size matching, etc.)

### 3. Also claim orders on AuthCallback

As a belt-and-suspenders approach, also call `claim-guest-orders` from `AuthCallback.tsx` after successful email verification. This catches cases where the user verifies later.

---

## Technical Details

### New Edge Function: `claim-guest-orders`

```
supabase/functions/claim-guest-orders/index.ts
```

- Authenticates the user via JWT
- Gets user email from `auth.users`
- Runs: `UPDATE orders SET user_id = $user_id, updated_at = now() WHERE guest_email = $email AND user_id IS NULL`
- Returns `{ claimed: number }`

### Modified Files

1. **`src/components/checkout/GuestSignupCard.tsx`**
   - After successful signup, call `claim-guest-orders` edge function
   - Update success message to mention onboarding after email verification
   - Add copy like "After verifying your email, we'll help you set up your profile for personalized gift recommendations"

2. **`src/pages/AuthCallback.tsx`**
   - After successful email verification (line 47-82), call `claim-guest-orders` to link any guest orders
   - This ensures orders are claimed even if the edge function call in GuestSignupCard was missed

3. **`src/components/checkout/GuestSignupCard.tsx` success state**
   - Improve the post-signup success message to set expectations about the onboarding flow

### Order Claiming Flow

```text
Guest Checkout
  |
  v
Order created (user_id=NULL, guest_email=X)
  |
  v
Guest creates password (GuestSignupCard)
  |-- calls claim-guest-orders (attempts early claim)
  |
  v
Guest verifies email (AuthCallback)
  |-- calls claim-guest-orders (guaranteed claim)
  |-- redirects to /profile-setup (onboarding)
  |
  v
User completes onboarding (DOB, shipping, interests)
  |
  v
User lands on dashboard -- orders visible in "My Orders"
```

### RLS Consideration

The `claim-guest-orders` edge function will use the service role key to perform the update, bypassing RLS. This is safe because:
- It only matches on the authenticated user's verified email
- It only claims orders with `user_id IS NULL`
- The email comes from the JWT, not user input
