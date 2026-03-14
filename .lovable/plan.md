

# Floating Auth Modal Over Homepage

## Problem
1. **Flash on navigation**: The `/auth` page renders a blank `min-h-[100dvh]` screen. The `isLoading` check and mode detection cause a brief white flash before content appears.
2. **SaaS feel**: The current full-page takeover (white background, centered form) feels like a SaaS login page, not an integrated e-commerce experience.

## Solution
Render the **homepage as the backdrop** with the auth flow in a **centered floating modal/dialog** overlaying it. When users navigate to `/auth`, they see the homepage (blurred/dimmed) behind a clean modal containing the stepped signup flow. This keeps the "shop" feel intact.

### Architecture

```text
/auth?mode=signup
┌──────────────────────────────────────────────┐
│  Homepage (dimmed, non-interactive)          │
│  ┌────────────────────────────────────────┐  │
│  │  Hero, Categories, etc (blurred bg)   │  │
│  │                                        │  │
│  │   ┌──────────────────────────┐         │  │
│  │   │   Floating Auth Modal    │         │  │
│  │   │                          │         │  │
│  │   │  Join Elyphant           │         │  │
│  │   │  [Continue with Google]  │         │  │
│  │   │  ─── or ───             │         │  │
│  │   │  [Sign up with email]   │         │  │
│  │   │                          │         │  │
│  │   └──────────────────────────┘         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Changes

**1. `src/pages/Auth.tsx`**
- Render `<MainLayout>` with `<HomeContent />` as the backdrop for ALL modes (signup + signin)
- Overlay a semi-transparent backdrop (`bg-black/40 backdrop-blur-sm`) over the homepage
- Render `<SteppedAuthFlow>` or `<SignInForm>` inside a floating modal container (centered `max-w-md`, rounded, white bg, shadow)
- Remove the `isLoading` spinner flash — instead show the homepage immediately and only show the modal once ready
- Close modal → navigate to `/` (homepage without auth)

**2. `src/components/auth/stepped/SteppedAuthFlow.tsx`**
- Remove the `min-h-[100dvh]` full-page wrapper from the entry screen — it now lives inside the modal container provided by Auth.tsx
- The entry screen and all steps render as modal content (no full-page background)
- Keep AnimatePresence transitions for step-to-step

**3. `src/components/auth/stepped/StepLayout.tsx`**
- Remove `min-h-[100dvh]` and `bg-background` — parent modal handles sizing
- Adjust to flex within modal height instead of full viewport
- Keep sticky bottom CTA but scoped to modal, not viewport
- On mobile: modal becomes full-height bottom sheet style (still with homepage dimmed behind)

**4. Modal behavior**
- Desktop: centered card, `max-w-md`, `max-h-[90vh]`, `overflow-y-auto`, rounded-2xl, shadow-2xl
- Mobile: near-full-height with rounded top corners, safe area padding preserved
- Backdrop click → navigate to `/` (dismiss and browse homepage)
- X button in top-right corner to close
- No flash: homepage renders immediately, modal fades in on top

### Flash fix
The flash comes from the loading state rendering a spinner inside `MainLayout` before content resolves. Fix: always render the homepage content behind the modal, and only conditionally show the modal overlay (with a fade-in animation). The `isLoading` state just delays showing the modal, not the entire page.

