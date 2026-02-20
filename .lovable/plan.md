
# Fix: Wishlist Click Navigation on Public Profiles

## The Problem

When Charles (a visitor) taps the "Test Gifts" wishlist circle on Justin's profile page, the expected behavior is to see Justin's full wishlist with all items and buy buttons. Instead, Charles only sees the top portion of an inline card that opens below the bubble grid — the "Test Gifts | Public / 6 items • justin's wishlist" header — and doesn't realize the items are further down the page (requiring a scroll).

This is a poor UX pattern, especially on mobile, because:
- The `InlineWishlistViewer` opens silently below the wishlist row with no scroll-to behavior
- On a small screen, the header card is partially visible but the item grid is off-screen
- There is no signal to the user that content appeared below

## Root Cause

In `InstagramWishlistGrid.tsx`, when a non-owner clicks a wishlist bubble, instead of navigating to the dedicated shared wishlist page, it calls the parent's `onWishlistClick` callback:

```typescript
// InstagramWishlistGrid.tsx
} else {
  // Expand wishlist inline for visitors
  if (onWishlistClick) {
    onWishlistClick(wishlist);  // ← opens InlineWishlistViewer inline
  }
}
```

Meanwhile, a perfectly functional full-page route already exists:
- **Route:** `/shared-wishlist/:wishlistId`
- **Page:** `src/pages/SharedWishlist.tsx`
- **Component:** `SharedWishlistView` — full page with items grid, purchase flow, and gift scheduling

## The Fix

**One file change, one line added:** In `InstagramWishlistGrid.tsx`, update the visitor click handler to navigate directly to `/shared-wishlist/:wishlistId` instead of calling the `onWishlistClick` callback.

### File: `src/components/user-profile/InstagramWishlistGrid.tsx`

Change lines 194–204 from:
```typescript
const handleWishlistClick = (wishlist: Wishlist) => {
  if (isOwnProfile) {
    navigate(`/wishlists?wishlist=${wishlist.id}&view=home`);
  } else {
    if (onWishlistClick) {
      onWishlistClick(wishlist);
    }
  }
};
```

To:
```typescript
const handleWishlistClick = (wishlist: Wishlist) => {
  if (isOwnProfile) {
    navigate(`/wishlists?wishlist=${wishlist.id}&view=home`);
  } else {
    // Navigate to the full shared wishlist page (not inline)
    navigate(`/shared-wishlist/${wishlist.id}`);
  }
};
```

That's it — a single navigation change.

## What This Delivers

| Before | After |
|--------|-------|
| Visitor taps wishlist bubble → inline card appears silently below (no scroll) | Visitor taps wishlist bubble → navigates to `/shared-wishlist/:id` full page |
| Items are off-screen on mobile — user doesn't know they exist | Full item grid visible immediately on a clean page |
| Poor discoverability | Dedicated page with proper back navigation |

## Downstream Cleanup

Since `InlineWishlistViewer` will no longer be triggered from the profile page for visitors, the `selectedWishlist` state and `onWishlistClick` prop in `InstagramProfileLayout.tsx` can be removed. However, this is optional cleanup — removing them is safe since they won't cause any errors if left in place.

The `InlineWishlistViewer` component itself should be kept — it may be useful in other contexts.

## Technical Notes

- The `/shared-wishlist/:wishlistId` route is already configured in `App.tsx` (line 258)
- `SharedWishlist.tsx` already handles loading the wishlist by ID, fetching owner profile, and rendering `SharedWishlistView` with cart and gift scheduling functionality
- No new routes or pages need to be created
- No backend changes needed
