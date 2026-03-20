

## Elevate the Post-Onboarding Welcome Modal

### Problem
The current modal is too plain — no branding, no visual warmth. Needs "Welcome to Elyphant" and a bit more visual personality while staying clean.

### Changes (single file: `PostOnboardingWelcome.tsx`)

**1. Add branding header**
- Add the Elyphant logo (import the `ElyphantTextLogo` component) centered above the text
- Change heading to **"Welcome to Elyphant, {firstName}"** or split into two lines: "Welcome to Elyphant" as the main heading and "Hey {firstName}, what would you like to do first?" as subtitle

**2. Add subtle visual warmth to action cards**
- Give each icon a soft circular background tint (e.g., light purple/violet at ~10% opacity) — consistent with the brand gradient palette
- Slightly increase card padding and add a subtle border (`border border-border/50`) so they feel more like tappable cards, not just rows
- Add a gentle `hover:shadow-sm` lift effect

**3. Add a thin divider or spacing**
- A subtle `<hr>` or extra spacing between the header and the action cards to give the layout more breathing room

**4. Polish the skip link**
- Make "Just browsing" slightly more visible — bump to `text-muted-foreground` (not /70) so it doesn't feel hidden

### Technical details
- Import `ElyphantTextLogo` from `@/components/ui/ElyphantTextLogo`
- All changes in `src/components/onboarding/PostOnboardingWelcome.tsx`
- No new dependencies, no route changes

