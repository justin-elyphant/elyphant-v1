

## Fix: Post-Onboarding Welcome Modal Not Appearing

### Root Cause

Two issues are preventing the welcome modal from showing:

1. **Stale `postOnboardingWelcomeSeen` flag** — This localStorage key persists across accounts. If you tested onboarding before in the same browser, the flag blocks the modal for all future signups. There's no per-user scoping.

2. **Fragile flag-based handoff** — `HomeContent` is rendered both inside `Auth.tsx` (as the background behind the modal) AND in `Home.tsx`. The `justCompletedSignup` flag is consumed in a `useEffect` with a 50ms debounce. If React's reconciliation causes any timing overlap between the Auth page unmounting and the Home page mounting, the flag could be consumed by the wrong instance.

### Fix

**File: `src/components/home/HomeContent.tsx`**
- Remove the `postOnboardingWelcomeSeen` guard from the flag check — instead, scope the "seen" flag per user ID (e.g., `postOnboardingWelcomeSeen_<userId>`) so it doesn't bleed across test accounts
- Add the user's profile/auth ID to the welcome-seen key

**File: `src/components/onboarding/PostOnboardingWelcome.tsx`**
- Update `handleAction` and `handleSkip` to write the user-scoped key instead of the global one

**File: `src/components/home/HomeContent.tsx` (additional hardening)**
- Increase the debounce from 50ms to 150ms to ensure the Auth page has fully unmounted before HomeContent on the Home page reads the flag
- Add a guard: skip the `justCompletedSignup` check if the current route is `/auth` (since HomeContent also renders there as background)

### Technical details
- 2 files modified: `HomeContent.tsx`, `PostOnboardingWelcome.tsx`
- The user-scoped key pattern: `postOnboardingWelcomeSeen_${user.id}`
- Need to pass user ID into the welcome-seen check — `useProfile()` is already available in HomeContent, and `useAuth()` can be added if needed
- No new dependencies or route changes

