

## Unify Profile + Wishlists — With Lululemon Style Alignment

### Style audit findings

The wishlist components currently violate the Lululemon design system in several places:

| Violation | Where | Fix |
|-----------|-------|-----|
| Purple-to-sky gradient on create button | `CompactProfileHeader.tsx` | Replace with `bg-[#DC2626]` solid red |
| Orange gradient hero banner (`from-[#EF4444] via-[#F97316] to-[#FB923C]`) | `WishlistHeroSection.tsx` | Replace with clean white card + red accent text, or subtle `bg-muted` |
| Purple/pink gradient backgrounds | `AllItemsView.tsx`, `NicoleAISuggestions.tsx`, `ShoppingHeroSection.tsx` | Remove gradients, use `bg-background` or `bg-muted/30` |
| Purple gradient workspace header | `WishlistWorkspaceHeader.tsx` | Replace with monochromatic header |
| Gradient benefit icons | `WishlistBenefitsGrid.tsx` | Use `bg-muted` with `text-foreground` icons |
| Purple empty-state circle | `MobileWishlistHub.tsx` | Use `bg-muted` or `bg-destructive/10` |

**The Lululemon rule**: monochromatic foundation (grey `#F7F7F7`, black text, white components), single red accent `#DC2626` for CTAs only. No purple, no orange, no multi-color gradients.

### Implementation — two phases in one pass

**Phase 1: Style cleanup** (touch 8-10 files)
- Replace all gradient buttons with `bg-[#DC2626] hover:bg-[#B91C1C]` or `variant="outline"`
- Replace gradient hero banners with clean white/grey cards using red accent sparingly
- Remove purple/pink background tints; use `bg-background` or `bg-muted/30`
- Nicole AI section keeps a subtle distinguishing style but uses `bg-muted` not purple gradients

**Phase 2: Profile → Wishlists merge** (as previously approved)

**`CompactProfileHeader.tsx`** — Restyle + add visitor mode
- Create button: `bg-[#DC2626]` solid, no gradient
- Add `visitorMode` prop with profile data, bio display, connection count
- Visitor mode shows Connect/Share buttons instead of Create
- Clean monochromatic styling throughout

**`WishlistHeroSection.tsx`** — Full restyle
- Remove orange gradient banner
- Replace with clean white card: dark text, subtle muted background
- Red accent only on primary CTA button
- Keep the same content (welcome, stats, create/browse buttons)

**`PublicWishlistView.tsx`** (new) — Visitor version of wishlist page
- Reuses `CompactProfileHeader` in visitor mode
- Shows public wishlists with `UnifiedWishlistCollectionCard` in read-only mode
- Clean monochromatic design matching the rest of the system
- Connect, Share, Send Gift buttons using standard button variants

**`UnifiedWishlistCollectionCard.tsx`** — Add `readOnly` prop
- Hide edit/delete/share dropdown when `readOnly`
- Card styling already uses `card-unified` (correct)
- Empty state button already uses `bg-[#DC2626]` (correct)

**`MobileWishlistHub.tsx`** — Style fixes
- Remove purple gradient from empty state icon container
- Use `bg-destructive/10` for the heart icon circle

**`NicoleAISuggestions.tsx`** — Style fixes
- Replace purple gradient icon backgrounds with `bg-muted`
- Use `text-foreground` for sparkle icons instead of `text-purple-600`

**`AllItemsView.tsx`** — Remove gradient background
**`ShoppingHeroSection.tsx`** — Remove gradient background + purple AI button
**`WishlistWorkspaceHeader.tsx`** — Replace gradient banner with monochromatic
**`WishlistBenefitsGrid.tsx`** — Replace gradient icon containers with `bg-muted`

**`src/pages/Profile.tsx`** — Own-profile redirect to `/wishlists`; public profile renders `PublicWishlistView`

**`navigationConfig.tsx`** — "My Profile" points to `/wishlists`

### Files removed after migration
- `InstagramProfileLayout.tsx`
- `MyProfilePreview.tsx`
- `InstagramWishlistGrid.tsx`
- `SocialProductGrid.tsx` (if unused)

### What stays unchanged
- All wishlist CRUD, checkout, Stripe, order flows
- Connection service, public profile data fetching
- Mobile/tablet/desktop responsive breakpoints
- `card-unified` base styling (already Lululemon-compliant)

### Responsive
No new responsive work — existing three-layout system (mobile/tablet/desktop) carries over. Style changes apply uniformly across all breakpoints.

