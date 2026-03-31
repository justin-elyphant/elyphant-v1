

## Make Avatar Dropdown "Invite Friends" Conditional on Beta Status

### Problem
The avatar dropdown in `UserButton.tsx` always shows **"Invite Friends, Get $100"** with the purple/pink gradient styling — for every user, including non-beta testers. This is inconsistent with the conditional logic we just added to the Connections hero and AddConnectionSheet.

### Fix
Same pattern as the hero section: use `useBetaCredits` to check if the user has beta credits, then conditionally render the CTA.

- **Beta tester (balance > 0)**: Show "Invite Friends, Get $100" with the gradient highlight styling
- **Regular user**: Show "Invite Friends" with standard styling (no $100 mention, no gradient)

Both versions still navigate to `/connections`.

### Files affected
- **Edit**: `src/components/auth/UserButton.tsx`
  - Import `useBetaCredits` hook
  - Add `isBetaTester` check
  - Update **both** referral CTAs (mobile ~line 248-255, desktop ~line 420-429) to conditionally show "$100" text and gradient styling

