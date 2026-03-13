

# Google OAuth + Stepped Onboarding Redesign

## Overview

Two integrated workstreams: (1) enable Google OAuth sign-in, and (2) replace the current card-based auth/onboarding with a Facebook-inspired one-step-per-screen flow using lululemon-minimal aesthetics. Both desktop and mobile/tablet/iOS Capacitor compliant.

---

## Part 1: Google OAuth Setup

**User action required (Supabase dashboard + Google Cloud Console):**

1. Go to [Google Cloud Console](https://console.cloud.google.com) → Create OAuth 2.0 credentials (Web application type)
2. Set Authorized JavaScript origins: `https://elyphant.ai` (+ `https://elyphant.lovable.app` for staging)
3. Set Authorized redirect URL: `https://dmkxtkvlispxeqfzlczr.supabase.co/auth/v1/callback`
4. Go to [Supabase Auth Providers](https://supabase.com/dashboard/project/dmkxtkvlispxeqfzlczr/auth/providers) → Enable Google → Paste Client ID + Secret
5. Ensure Site URL is set to `https://elyphant.ai` under Authentication → URL Configuration

**Code changes:**
- Fix `SocialLoginButtons.tsx`: Replace hardcoded `https://elyphant.ai/auth/oauth-complete` with `${window.location.origin}/auth` (route back into the stepped flow, not the old OAuth complete page)
- Remove Apple button for now (not configured), show only Google

---

## Part 2: Stepped Signup Flow

### New Files

| File | Purpose |
|------|---------|
| `src/components/auth/stepped/SteppedAuthFlow.tsx` | Orchestrator: `useReducer` for form state, step index, direction. Renders one step at a time with `AnimatePresence`. Detects OAuth session on mount (skip name/email/password steps). Calls `supabase.auth.signUp` at the end for email users, or updates profile for OAuth users. |
| `src/components/auth/stepped/StepLayout.tsx` | Shared wrapper: back arrow (top-left, 48px touch target), large heading, subtitle, content slot, sticky bottom CTA button. Uses `pb-safe pt-safe` for iOS notch. Full-screen white background, no card. Responsive: centered `max-w-md` on desktop, full-width on mobile. |
| `src/components/auth/stepped/steps/NameStep.tsx` | "What's your name?" -- First + Last name side-by-side. Pre-filled + locked if OAuth. |
| `src/components/auth/stepped/steps/EmailStep.tsx` | "What's your email?" -- Single email input. Skipped if OAuth. |
| `src/components/auth/stepped/steps/PasswordStep.tsx` | "Create a password" -- Password with strength indicator. Skipped if OAuth. |
| `src/components/auth/stepped/steps/BirthdayStep.tsx` | "When's your birthday?" -- Date picker with "Why?" expandable. |
| `src/components/auth/stepped/steps/InterestsStep.tsx` | "What are you into?" -- Chip grid from `COMMON_INTERESTS`. Min 1 selection. |
| `src/components/auth/stepped/steps/PhotoStep.tsx` | "Add a profile photo" -- Upload bubble + "Skip" link. Pre-filled from Google avatar if OAuth. |

### Modified Files

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | When `mode=signup` or "Get Started" tab selected, render `<SteppedAuthFlow>` instead of `<UnifiedAuthView>`. When `mode=signin`, render a minimal sign-in form (reuse existing `SignInForm` but without card wrapper, matching new aesthetic). Preserve all invitation token logic. |
| `src/components/auth/signin/SocialLoginButtons.tsx` | Fix redirect URL to `window.location.origin + '/auth'`. Remove Apple button. Style Google button as full-width with lululemon aesthetic. |
| `src/pages/OAuthComplete.tsx` | Simplify to just detect session + redirect to `/auth?mode=signup` with a `oauth_resume=true` query param so the stepped flow knows to skip steps 1-3. |
| `src/components/auth/guards/ProfileGuard.tsx` | Replace OAuth provider check (line 57-58) with `onboarding_completed` flag check. Stop routing to `/auth/oauth-complete`. |
| `src/pages/StreamlinedProfileSetup.tsx` | Redirect to `/auth?mode=signup` instead of rendering `UnifiedOnboarding` directly, so all onboarding goes through the stepped flow. |

### Deprecated (not deleted, just unused)

- `src/components/auth/OAuthProfileCompletion.tsx` (450 lines)
- `src/components/auth/oauth/OAuthProfileCompletion.tsx`
- `src/components/onboarding/UnifiedOnboarding.tsx` (1062 lines) -- functionality absorbed into stepped flow

### Flow Logic

```text
User clicks "Get Started"
  └─ SteppedAuthFlow mounts
      ├─ Shows Google button + "or sign up with email" divider
      ├─ EMAIL PATH: Name → Email → Password → Birthday → Interests → Photo → signUp() → redirect
      └─ GOOGLE PATH: OAuth redirect → callback → /auth?oauth_resume=true
           └─ SteppedAuthFlow detects session, pre-fills from user_metadata
               └─ Birthday → Interests → Photo (pre-filled from Google avatar) → update profile → redirect

User clicks "Sign In"
  └─ Minimal sign-in form (email + password + Google button) → redirect
```

### Responsive / iOS Capacitor Compliance

- **StepLayout**: `min-h-[100dvh]` with `pt-safe pb-safe` for iOS notch areas
- All interactive elements: `touch-target-44` minimum (48px preferred), `touch-manipulation` to eliminate 300ms tap delay
- Back arrow: 48px hit area, positioned with `top-4 left-4` absolute
- CTA button: sticky bottom on mobile (`fixed bottom-0 left-0 right-0 p-4 pb-safe bg-white`), inline on desktop
- Step transitions: `framer-motion` slide with `reducedMotion` respect
- Date picker: native `<input type="date">` on mobile for iOS wheel picker, custom DatePicker on desktop
- Chip grid: `flex-wrap` with `gap-2`, each chip 44px+ height
- No hover-only interactions; all states have visible focus/active indicators
- Breakpoints: full-width mobile up to `md` (768px), centered `max-w-md` from `md` up

### Design Tokens (Lululemon-Inspired)

- Background: `bg-white` (no cards, no gray backgrounds on auth screens)
- Headings: `text-2xl md:text-3xl font-semibold tracking-tight`
- Subtitles: `text-sm text-muted-foreground`
- Spacing: `py-12 md:py-20` top padding, `space-y-6` between elements
- CTA: Full-width, `h-12 md:h-11`, `bg-primary` (existing purple), rounded-lg
- Inputs: `h-12` height, `text-base` (prevents iOS zoom), `rounded-lg border-border`
- Step dots (optional): small circles at bottom, `w-2 h-2`, current = primary color
- Google button: White background, gray border, Google logo, full-width, `h-12`

### Data Flow

All form data collected in a single `useReducer` state. No intermediate API calls until final step:

**Email signup**: `supabase.auth.signUp()` with all metadata → profile insert → redirect
**OAuth signup**: Session already exists → profile upsert with collected birthday/interests/photo → redirect

Invite tokens: Persisted in `localStorage` (not `sessionStorage`) to survive OAuth redirects. Processed on final redirect in `Auth.tsx` (existing logic preserved).

---

## Implementation Order

1. Create `StepLayout.tsx` and `SteppedAuthFlow.tsx` (orchestrator)
2. Create all 6 step components
3. Wire into `Auth.tsx` (signup mode uses stepped flow, signin mode uses minimal form)
4. Fix `SocialLoginButtons.tsx` redirect URL + remove Apple
5. Update `OAuthComplete.tsx` to redirect into stepped flow
6. Update `ProfileGuard.tsx` to use `onboarding_completed` check
7. Update `StreamlinedProfileSetup.tsx` to redirect to stepped flow

