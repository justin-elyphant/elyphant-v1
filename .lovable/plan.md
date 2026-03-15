

## Problem

The `/auth?mode=signin` route renders the old `UnifiedAuthView` component (purple gradient tabs with "Sign In" / "Get Started"), which doesn't match the newer lululemon-style modal design used by the `SteppedAuthFlow` for signups.

There are effectively **two competing auth UIs**:
1. **SteppedAuthFlow** — clean, minimal, one-question-per-screen (used for signup)
2. **UnifiedAuthView** — old tabbed card with purple gradient (used for sign-in)

## Plan

**Replace `UnifiedAuthView` with a new minimalist sign-in view** that matches the SteppedAuthFlow's design language, rendered directly inside the same Auth.tsx modal.

### Changes

1. **`src/pages/Auth.tsx`** — Replace the `UnifiedAuthView` usage in the sign-in branch with a new clean `MinimalSignInView` component. Remove the `UnifiedAuthView` import.

2. **Create `src/components/auth/signin/MinimalSignInView.tsx`** — A simple, clean sign-in form matching the lululemon aesthetic:
   - Centered heading "Welcome Back" with subtle subtext (no gradient text)
   - Email and password fields with clean borders
   - Full-width "Sign In" button (solid, no gradient)
   - "Forgot your password?" link
   - "Don't have an account? **Get Started**" link that navigates to `/auth?mode=signup`
   - Accepts `preFilledEmail` and `invitationData` props
   - Uses the same padding/spacing as SteppedAuthFlow's entry screen (`px-6 py-10`)

3. **No changes to `SteppedAuthFlow`** — the signup flow stays as-is.

This consolidates the auth experience into one consistent visual language and eliminates the old tabbed UI entirely from the main auth flow. The `UnifiedAuthView` and its sub-components (`SignInForm`, `SignUpForm`) can be cleaned up later if no other routes reference them.

