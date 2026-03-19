

## Post-Onboarding Welcome Modal

### Overview
Create a welcome modal that appears immediately after signup, greeting the user by name and offering 3 clear next actions. It reuses the existing Dialog + framer-motion patterns from `OnboardingIntentModal`.

### Files to create

**`src/components/onboarding/PostOnboardingWelcome.tsx`**
- Dialog-based modal matching onboarding aesthetic (blurred backdrop, centered)
- Props: `open`, `userName`, `onDismiss`
- Content:
  - Sparkle/elephant icon header
  - "Welcome to Elyphant, {firstName}!" title
  - Brief subtitle: "Here's what you can do"
  - 3 motion-animated action cards (same style as `OnboardingIntentModal`):
    - **Find a Gift** (Gift icon) → navigates to `/gifts`
    - **Create a Wishlist** (List icon) → navigates to `/wishlists`
    - **Explore the Shop** (Search icon) → navigates to `/marketplace`
  - "Just browsing" skip link at bottom
- On any action or dismiss: sets `localStorage.setItem("postOnboardingWelcomeSeen", "true")`
- iOS-safe: uses `pb-safe`, `touch-manipulation`, `whileTap={{ scale: 0.97 }}`, 44px min touch targets

### Files to modify

**`src/components/auth/stepped/SteppedAuthFlow.tsx`**
- Add `localStorage.setItem("justCompletedSignup", "true")` before `navigate("/")` in both the OAuth path (line ~242) and the email path (line ~342)

**`src/components/home/HomeContent.tsx`**
- Import `PostOnboardingWelcome` and `useProfile`
- Add state: `showWelcomeModal`
- In the existing `useEffect`, instead of just clearing `justCompletedSignup`, also check that `postOnboardingWelcomeSeen` is not set — if both conditions met, set `showWelcomeModal = true`
- Render `<PostOnboardingWelcome>` with user's first name from profile context
- On dismiss, clear flag and close modal

### Technical notes
- No backend changes, no new DB tables
- Reuses existing `Dialog`, `Button`, `motion` patterns
- localStorage-gated: shows only once per user ever
- Works for both OAuth and email signup paths
- Consistent with existing iOS Capacitor compliance (safe areas, touch targets, overscroll)

