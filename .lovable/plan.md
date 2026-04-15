

## Enhance Invite Page: Header + Contextual Benefits

### Problem
The invite page currently has no Elyphant branding (no header/logo) and shows only a generic one-liner ("Create a free account to connect and start sharing wishlists"). New users lack context about what happens after signup.

### Changes to `src/pages/InvitePage.tsx`

**1. Add Elyphant header at the top**
- Import `ElyphantTextLogo` component
- Add a fixed top bar with the logo (clickable, navigates to `/`)
- Minimal styling: white background, subtle bottom border, consistent with brand

**2. Add personalized heading above the card**
- "{Name} invited you to Elyphant" as a title above the profile card

**3. Replace the generic subtitle with a 3-item benefits list** (for unauthenticated users only, below the CTA button):
- ✓ You'll be automatically connected with {FirstName}
- ✓ Create your first wishlist so {FirstName} knows what to get you
- ✓ Discover perfect gifts for friends and family

Each item uses a small check icon for visual clarity.

**4. Keep everything else intact** — avatar, name, username, bio, stats, CTA button all stay as-is.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/InvitePage.tsx` | Add ElyphantTextLogo header, heading text, and benefits list |

Single file change, no backend impact.

