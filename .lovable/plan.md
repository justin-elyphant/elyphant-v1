

# Fix Onboarding Modal: Scroll, Alignment, and Password Validation

## Issues

1. **Address step opens scrolled to bottom** — The modal has `overflow-y-auto` and when the address form is taller than the viewport, it renders with scroll position at the bottom instead of the top.

2. **Zip code and Phone Number misaligned** — The phone field has helper text ("Required for carrier delivery notifications") beneath it, pushing the two columns out of vertical alignment. The zip code column needs matching height handling.

3. **Weak password toast appears at Finish, not at Password step** — The `supabase.auth.signUp` call happens in `handleComplete` (step 7). Supabase rejects weak/breached passwords at signup time, so the error surfaces only after the user has filled out all remaining steps.

## Changes

### 1. Scroll to top on step change
**File: `src/pages/Auth.tsx`** (line ~231)
- Add an `id` or `ref` to the modal container
- OR: In `SteppedAuthFlow.tsx`, add a `useEffect` on `stepIndex` that scrolls the nearest scrollable ancestor to `scrollTop = 0` when the step changes. This ensures every step (including Address) opens from the top.

### 2. Fix zip/phone alignment
**File: `src/components/profile-setup/steps/shipping-address/ShippingAddressForm.tsx`** (lines 146-169)
- Add `items-start` to the `grid grid-cols-2 gap-4` wrapper so both columns align at the top
- Alternatively, add a matching invisible helper text spacer under the zip code field so both columns have equal height

### 3. Validate password strength at the Password step
**File: `src/components/auth/stepped/steps/PasswordStep.tsx`**
- In `handleNext`, before calling `onNext()`, make a lightweight call to check if the password is in Supabase's breached/weak password list. Since Supabase doesn't expose a standalone password-check endpoint, the cleanest approach is to add a strength requirement client-side: reject passwords that score below "Good" (strength < 3) with a clear inline error like "Please choose a stronger password"
- This prevents the user from proceeding with a weak password that Supabase will later reject at signup

**File: `src/components/auth/stepped/SteppedAuthFlow.tsx`**
- In the `handleComplete` catch block, if the error is about a weak password, show a more specific toast and navigate the user back to the password step instead of a generic error

