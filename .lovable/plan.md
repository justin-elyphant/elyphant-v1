

## Restyle Onboarding Auth Modal — Lululemon Aesthetic

### Problem
The signup modal (entry screen + stepped flow) looks like a generic SaaS form. It lacks the brand warmth and airy, editorial feel of the rest of the site.

### Changes

**1. Entry screen** (`SteppedAuthFlow.tsx`, lines 368-403)
- Add `ElyphantTextLogo` centered above the heading
- Soften the "Sign up with email" button — use a refined, rounded style with more height/padding, matching the brand (not the default chunky primary button)
- Add a subtle divider between the CTA and "Already have an account?"
- More vertical breathing room (increase padding from `px-6 py-10` to `px-8 py-12`)

**2. StepLayout** (`StepLayout.tsx`)
- Refine the progress dots: make them slightly smaller, use a softer active color (`bg-primary/80` instead of solid `bg-primary`) with a smooth width transition for the current dot (pill shape for active)
- Increase content area padding for more whitespace
- Soften the "Continue" button — slightly rounded corners (`rounded-xl`), lighter font weight
- Add a subtle top border or more spacing between the content and the CTA to separate them visually

**3. Auth modal wrapper** (`Auth.tsx`, lines 226-244)
- Already good — the floating modal with backdrop blur is on-brand. Minor tweak: increase border-radius to `rounded-3xl` for a softer feel

### What stays the same
- All step content (NameStep, EmailStep, etc.) — their inputs and labels are already clean
- All logic, validation, OAuth, invitation handling — untouched
- iOS compliance (touch targets, safe areas, scroll reset)

### Files to edit
1. `src/components/auth/stepped/SteppedAuthFlow.tsx` — entry screen styling + logo import
2. `src/components/auth/stepped/StepLayout.tsx` — progress dots, spacing, button refinement
3. `src/pages/Auth.tsx` — modal border-radius tweak

