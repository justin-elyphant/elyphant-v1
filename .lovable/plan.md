

## Redesign Post-Onboarding Welcome Modal

### What changes

Restyle the modal to match the Lululemon-inspired minimalist aesthetic and update the 3 action cards:

1. **Explore the Shop** (ShoppingBag icon) → `/marketplace` — "Discover gifts from top brands"
2. **Create a Wishlist** (List icon) → `/wishlists` — "Build and share your perfect list"
3. **Find Friends** (Users icon) → `/connections` — "Connect with friends & family"

### Style updates to `PostOnboardingWelcome.tsx`

- **Remove** the colored Sparkles circle header — replace with clean, minimal typography only (no icon bubble)
- **Heading**: "Welcome, {firstName}" in large semibold text, no "to Elyphant" branding clutter
- **Subtitle**: "What would you like to do first?" — warmer, action-oriented
- **Action cards**: Remove the `border-2` outlined button style. Use clean white cards with subtle shadow on hover, left-aligned icon + text, generous whitespace — matching the airy Lululemon feel
- **Icons**: Thin stroke, muted color (text-muted-foreground), not the current blue/primary fill
- **Skip link**: Keep "Just browsing" but style as lighter, more understated
- **Dialog**: Clean white background, more padding, no heavy borders

### Technical details

**Single file edit**: `src/components/onboarding/PostOnboardingWelcome.tsx`
- Update the `actions` array with new items, labels, descriptions, icons, and routes
- Restyle the header section (remove icon circle, simplify typography)
- Restyle action cards from `Button variant="outline"` to clean `div` cards with hover states
- Keep all existing localStorage logic, haptics, navigation, and iOS compliance (pb-safe, touch-manipulation, 44px targets) unchanged

No new files, no backend changes, no route changes.

