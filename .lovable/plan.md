

## Remove Post-Onboarding Welcome Modal

### Changes

**1. Delete `src/components/onboarding/PostOnboardingWelcome.tsx`**
- Remove the entire file

**2. Clean up `src/components/home/HomeContent.tsx`**
- Remove the `PostOnboardingWelcome` import
- Remove `showWelcomeModal` state
- Remove all `justCompletedSignup` / `postOnboardingWelcomeSeen` localStorage logic from the useEffect
- Remove the `<PostOnboardingWelcome>` JSX
- Keep the remaining useEffect logic (Nicole context, preloading, cleanup) and the auth-route guard

**3. Clean up `src/components/auth/stepped/SteppedAuthFlow.tsx`**
- Remove the two `localStorage.setItem("justCompletedSignup", "true")` lines (the navigate and refetch stay)

**4. Clean up `src/components/auth/enhanced/EnhancedAuthModalV2.tsx`**
- Remove the `localStorage.setItem('justCompletedSignup', 'true')` line

### What stays
- The existing Hero CTA buttons ("Start Gifting" / "Create Wishlists") remain as the primary post-signup guidance
- All other homepage sections, onboarding steps, and auth logic are untouched

### Files affected
- 1 file deleted, 3 files edited

