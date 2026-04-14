

## Fix: Signup redirect interrupts Phase 2 onboarding

### Problem
After Phase 1 (`signUp`) succeeds at the password step, Supabase immediately sets the session user. This triggers the `useEffect` in `Auth.tsx` (lines 94-107) which sees `user` is non-null, finds no pending invitation, and redirects to `/` — skipping birthday, interests, address, and photo steps entirely.

### Root cause
`Auth.tsx` line 102-106:
```js
if (!hasPendingLinking) {
  navigate(redirectPath || '/', { replace: true });
  return;
}
```
No check exists for whether the user is mid-signup (onboarding incomplete).

### Fix
In `Auth.tsx`, add one condition to the redirect logic: if the user's profile has `onboarding_completed === false` (or no profile yet), do NOT redirect — let the stepped flow continue.

**File: `src/pages/Auth.tsx`** — modify the `useEffect` at line 94:

```js
useEffect(() => {
  if (!user || isLoading) return;

  // If signup/onboarding is still in progress, don't redirect
  // profileData will be null or have onboarding_completed=false for mid-signup users
  if (isSignupMode || isOAuthResume) {
    // Check if onboarding is actually complete before redirecting
    if (!profileData?.onboarding_completed) {
      return; // Stay on auth page, let SteppedAuthFlow continue
    }
  }

  // ... rest of existing redirect logic unchanged
```

This is a 3-line addition. No other files change. The stepped flow's own `handleComplete` already calls `navigate("/")` after successfully completing onboarding.

### Why this is safe
- Sign-in mode (`mode=signin`) is unaffected — it doesn't set `isSignupMode`
- OAuth resume is covered by the `isOAuthResume` check
- Fully onboarded users (`onboarding_completed: true`) still redirect normally
- The stepped flow handles its own navigation on completion

